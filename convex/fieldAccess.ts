/**
 * Field-role access: surveyor (own), supervisor/QC (assigned), admin (all).
 * Centralises multi-city allotment + ward rules used by survey list, analytics, exports.
 */
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { hasCapability } from "./capabilities";
import { canReadWard } from "./helpers";
import { resolveTenantScope, tenantDistrictIds, tenantMunicipalityIds } from "./tenancy";

export type FieldSurveyAccess = "own" | "assigned" | "admin" | "none";

/** True when the user creates/edits only their own field surveys (mobile surveyor scope). */
export async function isOwnScopeSurveyor(ctx: QueryCtx, user: Doc<"users">): Promise<boolean> {
  return (await fieldSurveyAccess(ctx, user)) === "own";
}

export async function fieldSurveyAccess(ctx: QueryCtx, user: Doc<"users">): Promise<FieldSurveyAccess> {
  if (user.role === "admin") return "admin";
  // Assigned / QC scope is broader than own — check it first so dual-capability users
  // (e.g. supervisor profile with leftover viewOwn) still see the full ULB.
  if ((await hasCapability(ctx, user, "surveys.viewAssigned")) || (await hasCapability(ctx, user, "qc.review"))) {
    return "assigned";
  }
  if (await hasCapability(ctx, user, "surveys.viewOwn")) return "own";
  return "none";
}

type SurveyListQueryArgs = {
  municipalityId?: Id<"municipalities">;
  districtId?: Id<"districts">;
  status?: Doc<"surveys">["status"];
  surveyorId?: Id<"users">;
  limit: number;
};

async function queryByMunicipality(
  ctx: QueryCtx,
  municipalityId: Id<"municipalities">,
  status: Doc<"surveys">["status"] | undefined,
  take: number,
): Promise<Doc<"surveys">[]> {
  return ctx.db
    .query("surveys")
    .withIndex("by_municipality_status", (q) =>
      status ? q.eq("municipalityId", municipalityId).eq("status", status) : q.eq("municipalityId", municipalityId),
    )
    .order("desc")
    .take(take);
}

async function queryByDistrict(
  ctx: QueryCtx,
  districtId: Id<"districts">,
  status: Doc<"surveys">["status"] | undefined,
  take: number,
): Promise<Doc<"surveys">[]> {
  return ctx.db
    .query("surveys")
    .withIndex("by_district_status", (q) =>
      status ? q.eq("districtId", districtId).eq("status", status) : q.eq("districtId", districtId),
    )
    .order("desc")
    .take(take);
}

/** Ward narrowing is for surveyors; QC / supervisor roles see the full allotted ULB. */
async function wardLimitsApply(ctx: QueryCtx, user: Doc<"users">): Promise<boolean> {
  if (user.role === "admin" || user.role === "supervisor" || user.role === "qc_supervisor") return false;
  if (user.wardAssignments.length === 0) return false;
  const [viewAssigned, qcReview, viewOwn] = await Promise.all([
    hasCapability(ctx, user, "surveys.viewAssigned"),
    hasCapability(ctx, user, "qc.review"),
    hasCapability(ctx, user, "surveys.viewOwn"),
  ]);
  if (viewAssigned || qcReview) return false;
  return viewOwn;
}

async function filterSurveysInScope(
  ctx: QueryCtx,
  rows: Doc<"surveys">[],
  me: Doc<"users">,
  muniIds: Set<Id<"municipalities">>,
): Promise<Doc<"surveys">[]> {
  const applyWardLimits = await wardLimitsApply(ctx, me);
  return rows.filter((r) => {
    if (!muniIds.has(r.municipalityId)) return false;
    if (!applyWardLimits) return true;
    return canReadWard(me, r.municipalityId, r.wardNo);
  });
}

/** Load surveys visible to surveyor / supervisor / QC / admin within tenant scope. */
export async function querySurveysInFieldScope(
  ctx: QueryCtx,
  me: Doc<"users">,
  args: SurveyListQueryArgs,
): Promise<Doc<"surveys">[]> {
  const access = await fieldSurveyAccess(ctx, me);
  const scope = await resolveTenantScope(ctx, me);
  const muniIds = tenantMunicipalityIds(scope);
  const districtIds = tenantDistrictIds(scope);
  const take = args.limit * 2;

  if (access === "none") return [];

  if (access === "own") {
    const rows = await ctx.db
      .query("surveys")
      .withIndex("by_surveyor", (q) => q.eq("surveyorId", me._id))
      .order("desc")
      .take(take);
    return (await filterSurveysInScope(ctx, rows, me, muniIds)).slice(0, args.limit);
  }

  if (args.surveyorId) {
    const rows = await ctx.db
      .query("surveys")
      .withIndex("by_surveyor", (q) => q.eq("surveyorId", args.surveyorId!))
      .order("desc")
      .take(take);
    return (await filterSurveysInScope(ctx, rows, me, muniIds)).slice(0, args.limit);
  }

  if (access === "admin") {
    if (args.municipalityId) {
      return (await queryByMunicipality(ctx, args.municipalityId, args.status, take)).slice(0, args.limit);
    }
    if (args.districtId) {
      return (await queryByDistrict(ctx, args.districtId, args.status, take)).slice(0, args.limit);
    }
    const rows = await ctx.db.query("surveys").order("desc").take(take);
    return (await filterSurveysInScope(ctx, rows, me, muniIds)).slice(0, args.limit);
  }

  // Assigned scope (supervisor / QC): honour every active ULB allotment, not only profile municipalityId.
  const scopedMunis = args.municipalityId
    ? [args.municipalityId]
    : scope.municipalities.length > 0
      ? scope.municipalities.map((m) => m._id)
      : me.municipalityId
        ? [me.municipalityId]
        : [];

  let rows: Doc<"surveys">[] = [];

  if (scopedMunis.length > 1) {
    const batches = await Promise.all(
      scopedMunis.map((municipalityId) => queryByMunicipality(ctx, municipalityId, args.status, take)),
    );
    const seen = new Set<string>();
    for (const batch of batches) {
      for (const row of batch) {
        if (seen.has(row._id)) continue;
        seen.add(row._id);
        rows.push(row);
      }
    }
    rows.sort((a, b) => b._creationTime - a._creationTime);
  } else if (scopedMunis.length === 1) {
    const muniId = scopedMunis[0]!;
    rows = args.status
      ? await ctx.db
          .query("surveys")
          .withIndex("by_municipality_status", (q) => q.eq("municipalityId", muniId).eq("status", args.status!))
          .collect()
      : await ctx.db
          .query("surveys")
          .withIndex("by_municipality_status", (q) => q.eq("municipalityId", muniId))
          .collect();
  } else {
    const districtKey =
      args.districtId ?? (scope.districts.length === 1 ? scope.districts[0]!._id : (me.districtId ?? undefined));
    if (districtKey && districtIds.has(districtKey)) {
      rows = await queryByDistrict(ctx, districtKey, args.status, take);
    }
  }

  return (await filterSurveysInScope(ctx, rows, me, muniIds)).slice(0, args.limit);
}

/** Collect all surveys in assigned/admin scope (analytics dashboards). */
export async function collectSurveysInFieldScope(ctx: QueryCtx, me: Doc<"users">): Promise<Doc<"surveys">[]> {
  const access = await fieldSurveyAccess(ctx, me);
  const scope = await resolveTenantScope(ctx, me);
  const muniIds = tenantMunicipalityIds(scope);

  if (access === "none") return [];

  if (access === "own") {
    const rows = await ctx.db
      .query("surveys")
      .withIndex("by_surveyor", (q) => q.eq("surveyorId", me._id))
      .collect();
    return await filterSurveysInScope(ctx, rows, me, muniIds);
  }

  if (access === "admin") {
    const rows = await ctx.db.query("surveys").collect();
    return await filterSurveysInScope(ctx, rows, me, muniIds);
  }

  const scopedMunis =
    scope.municipalities.length > 0
      ? scope.municipalities.map((m) => m._id)
      : me.municipalityId
        ? [me.municipalityId]
        : [];

  let rows: Doc<"surveys">[] = [];

  if (scopedMunis.length > 1) {
    const batches = await Promise.all(
      scopedMunis.map((id) =>
        ctx.db
          .query("surveys")
          .withIndex("by_municipality_status", (q) => q.eq("municipalityId", id))
          .collect(),
      ),
    );
    const seen = new Set<string>();
    for (const batch of batches) {
      for (const row of batch) {
        if (seen.has(row._id)) continue;
        seen.add(row._id);
        rows.push(row);
      }
    }
  } else if (scopedMunis.length === 1) {
    rows = await ctx.db
      .query("surveys")
      .withIndex("by_municipality_status", (q) => q.eq("municipalityId", scopedMunis[0]!))
      .collect();
  } else if (scope.districts.length === 1) {
    rows = await ctx.db
      .query("surveys")
      .withIndex("by_district", (q) => q.eq("districtId", scope.districts[0]!._id))
      .collect();
  }

  return await filterSurveysInScope(ctx, rows, me, muniIds);
}
