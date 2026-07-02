import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { fieldSurveyAccess } from "../fieldAccess";
import { resolveTenantScope, tenantMunicipalityIds } from "../tenancy";
import type { DashboardCounts } from "./surveyStatsAggregate";

type SurveySnapshot = Pick<Doc<"surveys">, "municipalityId" | "status" | "qcStatus" | "_creationTime" | "submittedAt">;

type MunicipalityBucket = {
  total: number;
  drafts: number;
  submitted: number;
  qcApproved: number;
  qcRejected: number;
  qcPending: number;
};

type DailyBucket = {
  created: number;
  submitted: number;
};

const EMPTY_MUNI_BUCKET: MunicipalityBucket = {
  total: 0,
  drafts: 0,
  submitted: 0,
  qcApproved: 0,
  qcRejected: 0,
  qcPending: 0,
};

function formatDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function municipalityBucketFor(survey: SurveySnapshot): MunicipalityBucket {
  const bucket = { ...EMPTY_MUNI_BUCKET, total: 1 };
  if (survey.status === "draft") bucket.drafts = 1;
  if (survey.status === "submitted") bucket.submitted = 1;
  if (survey.qcStatus === "approved") bucket.qcApproved = 1;
  if (survey.qcStatus === "rejected") bucket.qcRejected = 1;
  if (survey.qcStatus === "pending" && survey.status === "submitted") bucket.qcPending = 1;
  return bucket;
}

function dailyBucketFor(survey: SurveySnapshot, dateKey: string): DailyBucket {
  const bucket = { created: 0, submitted: 0 };
  const dayStart = startOfDayMsFromKey(dateKey);
  const dayEnd = dayStart + 86_400_000;
  if (survey._creationTime >= dayStart && survey._creationTime < dayEnd) bucket.created = 1;
  if (survey.status === "submitted") {
    const submittedAt = survey.submittedAt ?? survey._creationTime;
    if (submittedAt >= dayStart && submittedAt < dayEnd) bucket.submitted = 1;
  }
  return bucket;
}

function startOfDayMsFromKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y!, m! - 1, d!).setHours(0, 0, 0, 0);
}

function addMunicipalityBuckets(target: MunicipalityBucket, delta: MunicipalityBucket, sign: 1 | -1) {
  target.total += sign * delta.total;
  target.drafts += sign * delta.drafts;
  target.submitted += sign * delta.submitted;
  target.qcApproved += sign * delta.qcApproved;
  target.qcRejected += sign * delta.qcRejected;
  target.qcPending += sign * delta.qcPending;
}

function addDailyBuckets(target: DailyBucket, delta: DailyBucket, sign: 1 | -1) {
  target.created += sign * delta.created;
  target.submitted += sign * delta.submitted;
}

async function getOrCreateMunicipalityStats(ctx: MutationCtx, municipalityId: Id<"municipalities">) {
  const existing = await ctx.db
    .query("surveyMunicipalityStats")
    .withIndex("by_municipality", (q) => q.eq("municipalityId", municipalityId))
    .unique();
  if (existing) return existing;

  const id = await ctx.db.insert("surveyMunicipalityStats", {
    municipalityId,
    ...EMPTY_MUNI_BUCKET,
  });
  return (await ctx.db.get(id))!;
}

async function getOrCreateDailyStats(ctx: MutationCtx, municipalityId: Id<"municipalities">, dateKey: string) {
  const existing = await ctx.db
    .query("surveyDailyStats")
    .withIndex("by_municipality_date", (q) => q.eq("municipalityId", municipalityId).eq("dateKey", dateKey))
    .unique();
  if (existing) return existing;

  const id = await ctx.db.insert("surveyDailyStats", {
    municipalityId,
    dateKey,
    created: 0,
    submitted: 0,
  });
  return (await ctx.db.get(id))!;
}

async function applyMunicipalityDelta(
  ctx: MutationCtx,
  municipalityId: Id<"municipalities">,
  delta: MunicipalityBucket,
  sign: 1 | -1,
) {
  const row = await getOrCreateMunicipalityStats(ctx, municipalityId);
  await ctx.db.patch(row._id, {
    total: Math.max(0, row.total + sign * delta.total),
    drafts: Math.max(0, row.drafts + sign * delta.drafts),
    submitted: Math.max(0, row.submitted + sign * delta.submitted),
    qcApproved: Math.max(0, row.qcApproved + sign * delta.qcApproved),
    qcRejected: Math.max(0, row.qcRejected + sign * delta.qcRejected),
    qcPending: Math.max(0, row.qcPending + sign * delta.qcPending),
  });
}

async function applyDailyDelta(
  ctx: MutationCtx,
  municipalityId: Id<"municipalities">,
  dateKey: string,
  delta: DailyBucket,
  sign: 1 | -1,
) {
  const row = await getOrCreateDailyStats(ctx, municipalityId, dateKey);
  await ctx.db.patch(row._id, {
    created: Math.max(0, row.created + sign * delta.created),
    submitted: Math.max(0, row.submitted + sign * delta.submitted),
  });
}

function dateKeysForSurvey(survey: SurveySnapshot): string[] {
  const keys = new Set<string>();
  keys.add(formatDateKey(survey._creationTime));
  if (survey.submittedAt !== undefined) keys.add(formatDateKey(survey.submittedAt));
  return [...keys];
}

async function applySurveySnapshot(ctx: MutationCtx, survey: SurveySnapshot, sign: 1 | -1) {
  const muniDelta = municipalityBucketFor(survey);
  await applyMunicipalityDelta(ctx, survey.municipalityId, muniDelta, sign);

  for (const dateKey of dateKeysForSurvey(survey)) {
    const dailyDelta = dailyBucketFor(survey, dateKey);
    if (dailyDelta.created === 0 && dailyDelta.submitted === 0) continue;
    await applyDailyDelta(ctx, survey.municipalityId, dateKey, dailyDelta, sign);
  }
}

/** Record a newly inserted survey in denormalized stats tables. */
export async function recordSurveyStatsInsert(ctx: MutationCtx, survey: Doc<"surveys">) {
  await applySurveySnapshot(ctx, survey, 1);
}

/** Remove a deleted survey from denormalized stats tables. */
export async function recordSurveyStatsRemove(ctx: MutationCtx, survey: Doc<"surveys">) {
  await applySurveySnapshot(ctx, survey, -1);
}

/** Apply a survey update that may change status, qcStatus, or municipality. */
export async function recordSurveyStatsUpdate(ctx: MutationCtx, before: Doc<"surveys">, after: Doc<"surveys">) {
  if (before.municipalityId !== after.municipalityId) {
    await applySurveySnapshot(ctx, before, -1);
    await applySurveySnapshot(ctx, after, 1);
    return;
  }

  const beforeMuni = municipalityBucketFor(before);
  const afterMuni = municipalityBucketFor(after);
  const muniDelta: MunicipalityBucket = { ...EMPTY_MUNI_BUCKET };
  addMunicipalityBuckets(muniDelta, afterMuni, 1);
  addMunicipalityBuckets(muniDelta, beforeMuni, -1);

  if (
    muniDelta.total !== 0 ||
    muniDelta.drafts !== 0 ||
    muniDelta.submitted !== 0 ||
    muniDelta.qcApproved !== 0 ||
    muniDelta.qcRejected !== 0 ||
    muniDelta.qcPending !== 0
  ) {
    await applyMunicipalityDelta(ctx, after.municipalityId, muniDelta, 1);
  }

  const dateKeys = new Set([...dateKeysForSurvey(before), ...dateKeysForSurvey(after)]);
  for (const dateKey of dateKeys) {
    const beforeDaily = dailyBucketFor(before, dateKey);
    const afterDaily = dailyBucketFor(after, dateKey);
    const dailyDelta: DailyBucket = { created: 0, submitted: 0 };
    addDailyBuckets(dailyDelta, afterDaily, 1);
    addDailyBuckets(dailyDelta, beforeDaily, -1);
    if (dailyDelta.created === 0 && dailyDelta.submitted === 0) continue;
    await applyDailyDelta(ctx, after.municipalityId, dateKey, dailyDelta, 1);
  }
}

/** Fast dashboard KPI counts from denormalized tables when fully backfilled. */
export async function loadDashboardCountsFromStats(
  ctx: QueryCtx,
  me: Doc<"users">,
  todayMs: number,
): Promise<DashboardCounts | null> {
  const access = await fieldSurveyAccess(ctx, me);
  if (access === "none" || me.status !== "active") return null;

  // Ward-narrowed roles need per-row scope filtering — fall back to full aggregation.
  if (access === "own") return null;
  if (me.role === "surveyor" && me.wardAssignments.length > 0) return null;
  if (me.role === "qc_supervisor" && me.wardAssignments.length > 0) return null;

  const scope = await resolveTenantScope(ctx, me);
  const muniIds = [...tenantMunicipalityIds(scope)];

  let scopedMuniIds: Id<"municipalities">[];
  if (access === "admin") {
    scopedMuniIds = scope.municipalities.length > 0 ? scope.municipalities.map((m) => m._id) : muniIds;
  } else {
    scopedMuniIds =
      scope.municipalities.length > 0
        ? scope.municipalities.map((m) => m._id)
        : me.municipalityId
          ? [me.municipalityId]
          : [];
  }

  if (scopedMuniIds.length === 0) return null;

  const muniStats = await Promise.all(
    scopedMuniIds.map((municipalityId) =>
      ctx.db
        .query("surveyMunicipalityStats")
        .withIndex("by_municipality", (q) => q.eq("municipalityId", municipalityId))
        .unique(),
    ),
  );

  if (muniStats.some((row) => !row)) return null;

  const dateKey = formatDateKey(todayMs);
  const dailyStats = await Promise.all(
    scopedMuniIds.map((municipalityId) =>
      ctx.db
        .query("surveyDailyStats")
        .withIndex("by_municipality_date", (q) => q.eq("municipalityId", municipalityId).eq("dateKey", dateKey))
        .unique(),
    ),
  );

  const totals: DashboardCounts = {
    total: 0,
    today: 0,
    drafts: 0,
    pending: 0,
    submittedToday: 0,
    approved: 0,
    submitted: 0,
    rejected: 0,
  };

  for (const row of muniStats) {
    if (!row) continue;
    totals.total += row.total;
    totals.drafts += row.drafts;
    totals.submitted += row.submitted;
    totals.approved += row.qcApproved;
    totals.rejected += row.qcRejected;
    totals.pending += row.qcPending;
  }

  for (const row of dailyStats) {
    if (!row) continue;
    totals.today += row.created;
    totals.submittedToday += row.submitted;
  }

  return totals;
}
