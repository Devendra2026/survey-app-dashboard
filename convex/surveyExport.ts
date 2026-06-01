/**
 * Full survey export (all mobile fields + floors + photos) and Excel re-import.
 */
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { normalizeAddressFields } from "./addressRules";
import { normalizeFloorFields, presentFloorRow, usageTypeToOccupied, validateFloorRow } from "./areaMasters";
import { assertCanReadWard, clientError, requireRole, requireUser, writeAudit } from "./helpers";
import { comparePropertyIds, resolvePropertyId } from "./propertyId";
import { qcStatus, surveyStatus } from "./schema";
import {
  mergeDraftArgs,
  normalizeOwnerFields,
  normalizePropertyFields,
  stripLocalId,
  withResolvedPropertyId,
} from "./survey";
import { assertMunicipalityInScope, resolveTenantScope, tenantDistrictIds, tenantMunicipalityIds } from "./tenancy";

const listFilterArgs = {
  status: v.optional(surveyStatus),
  qcStatus: v.optional(qcStatus),
  wardNo: v.optional(v.string()),
  districtId: v.optional(v.id("districts")),
  municipalityId: v.optional(v.id("municipalities")),
  surveyorId: v.optional(v.id("users")),
};

async function loadMunicipalityCodes(
  ctx: QueryCtx,
  municipalityIds: Id<"municipalities">[],
): Promise<Map<Id<"municipalities">, string>> {
  const unique = [...new Set(municipalityIds)];
  const munis = await Promise.all(unique.map((id) => ctx.db.get(id)));
  return new Map(munis.filter((m): m is Doc<"municipalities"> => m != null).map((m) => [m._id, m.code] as const));
}

function enrichSurveyPropertyIds(rows: Doc<"surveys">[], codes: Map<Id<"municipalities">, string>): Doc<"surveys">[] {
  return rows.map((row) => ({
    ...row,
    propertyId: resolvePropertyId(row, codes.get(row.municipalityId) ?? "") ?? row.propertyId,
  }));
}

/** Same filters as survey.list but up to 5k rows with floors, photos, and labels. */
export const listForExport = query({
  args: {
    ...listFilterArgs,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    requireRole(me, "supervisor", "admin", "surveyor");
    const limit = Math.min(args.limit ?? 5000, 5000);

    const scope = await resolveTenantScope(ctx, me);
    const districtIds = tenantDistrictIds(scope);
    const muniIds = tenantMunicipalityIds(scope);

    if (args.municipalityId) {
      await assertMunicipalityInScope(ctx, me, args.municipalityId);
    }
    if (args.districtId && me.role !== "admin" && !districtIds.has(args.districtId)) {
      clientError("FORBIDDEN", "This district is outside your assigned scope");
    }

    let rows: Doc<"surveys">[];
    if (me.role === "surveyor") {
      rows = await ctx.db
        .query("surveys")
        .withIndex("by_surveyor", (q) => q.eq("surveyorId", me._id))
        .order("desc")
        .take(limit * 2);
      rows = rows.filter((r) => !r.districtId || districtIds.has(r.districtId)).slice(0, limit);
    } else if (me.role === "supervisor") {
      const districtKey = args.districtId ?? (scope.districts.length === 1 ? scope.districts[0]!._id : undefined);
      const muniKey = args.municipalityId ?? me.municipalityId;

      if (muniKey) {
        rows = await ctx.db
          .query("surveys")
          .withIndex("by_municipality_status", (q) =>
            args.status ? q.eq("municipalityId", muniKey).eq("status", args.status) : q.eq("municipalityId", muniKey),
          )
          .order("desc")
          .take(limit * 2);
      } else if (districtKey) {
        rows = await ctx.db
          .query("surveys")
          .withIndex("by_district_status", (q) =>
            args.status ? q.eq("districtId", districtKey).eq("status", args.status) : q.eq("districtId", districtKey),
          )
          .order("desc")
          .take(limit * 2);
      } else {
        return [];
      }
      rows = rows.slice(0, limit);
    } else if (me.role === "admin") {
      if (args.municipalityId) {
        rows = await ctx.db
          .query("surveys")
          .withIndex("by_municipality_status", (q) =>
            args.status
              ? q.eq("municipalityId", args.municipalityId!).eq("status", args.status)
              : q.eq("municipalityId", args.municipalityId!),
          )
          .order("desc")
          .take(limit * 2);
      } else if (args.districtId) {
        rows = await ctx.db
          .query("surveys")
          .withIndex("by_district_status", (q) =>
            args.status
              ? q.eq("districtId", args.districtId!).eq("status", args.status)
              : q.eq("districtId", args.districtId!),
          )
          .order("desc")
          .take(limit * 2);
      } else if (args.surveyorId) {
        rows = await ctx.db
          .query("surveys")
          .withIndex("by_surveyor", (q) => q.eq("surveyorId", args.surveyorId!))
          .order("desc")
          .take(limit * 2);
      } else {
        rows = await ctx.db
          .query("surveys")
          .withIndex("by_property_id")
          .order("asc")
          .take(limit * 2);
      }
      rows = rows.slice(0, limit);
    } else {
      rows = [];
    }

    rows = rows.filter((r) => muniIds.has(r.municipalityId));
    if (args.districtId) rows = rows.filter((r) => r.districtId === args.districtId);
    if (args.municipalityId) rows = rows.filter((r) => r.municipalityId === args.municipalityId);
    if (args.surveyorId) rows = rows.filter((r) => r.surveyorId === args.surveyorId);
    if (args.status && me.role !== "supervisor") {
      rows = rows.filter((r) => r.status === args.status);
    }
    if (args.qcStatus) rows = rows.filter((r) => r.qcStatus === args.qcStatus);
    if (args.wardNo) rows = rows.filter((r) => r.wardNo === args.wardNo);
    rows.sort((a, b) => comparePropertyIds(a.propertyId, b.propertyId));

    const codes = await loadMunicipalityCodes(
      ctx,
      rows.map((r) => r.municipalityId),
    );
    const enriched = enrichSurveyPropertyIds(rows, codes);

    const muniIdSet = [...new Set(enriched.map((r) => r.municipalityId))];
    const districtIdSet = [...new Set(enriched.map((r) => r.districtId))];
    const surveyorIdSet = [...new Set(enriched.map((r) => r.surveyorId))];

    const [munis, districts, surveyors] = await Promise.all([
      Promise.all(muniIdSet.map((id) => ctx.db.get(id))),
      Promise.all(districtIdSet.map((id) => ctx.db.get(id))),
      Promise.all(surveyorIdSet.map((id) => ctx.db.get(id))),
    ]);

    const muniMap = new Map(munis.filter(Boolean).map((m) => [m!._id, m!]));
    const districtMap = new Map(districts.filter(Boolean).map((d) => [d!._id, d!]));
    const surveyorMap = new Map(surveyors.filter(Boolean).map((u) => [u!._id, u!]));

    return Promise.all(
      enriched.map(async (survey) => {
        const [floorRows, photoRows] = await Promise.all([
          ctx.db
            .query("floors")
            .withIndex("by_survey", (q) => q.eq("surveyId", survey._id))
            .collect(),
          ctx.db
            .query("photos")
            .withIndex("by_survey", (q) => q.eq("surveyId", survey._id))
            .collect(),
        ]);

        const photos = await Promise.all(
          photoRows.map(async (p) => ({
            slot: p.slot,
            sizeKb: p.sizeKb,
            width: p.width,
            height: p.height,
            capturedAt: p.capturedAt,
            url: await ctx.storage.getUrl(p.storageId),
          })),
        );

        const muni = muniMap.get(survey.municipalityId);
        const district = districtMap.get(survey.districtId);
        const surveyor = surveyorMap.get(survey.surveyorId);

        return {
          ...survey,
          districtName: district?.name ?? "",
          municipalityName: muni?.name ?? survey.city,
          municipalityCode: muni?.code ?? "",
          surveyorName: surveyor?.name ?? "",
          surveyorEmail: surveyor?.email ?? "",
          floors: floorRows.sort((a, b) => a.position - b.position).map(presentFloorRow),
          photos,
        };
      }),
    );
  },
});

const importSurveyRow = v.object({
  localId: v.string(),
  municipalityId: v.id("municipalities"),
  wardNo: v.string(),
  propertyId: v.optional(v.string()),
  sectorNo: v.optional(v.string()),
  oldPropertyNo: v.optional(v.string()),
  parcelNo: v.string(),
  unitNo: v.string(),
  constructedYear: v.optional(v.number()),
  isSlum: v.optional(v.boolean()),
  respondentName: v.optional(v.string()),
  relationship: v.optional(v.string()),
  familySize: v.optional(v.number()),
  mobileNo: v.optional(v.string()),
  altMobileNo: v.optional(v.string()),
  houseNo: v.optional(v.string()),
  locality: v.optional(v.string()),
  colonyName: v.optional(v.string()),
  city: v.optional(v.string()),
  pinCode: v.optional(v.string()),
  assessmentYear: v.optional(v.string()),
  ownershipType: v.optional(v.string()),
  propertyType: v.optional(v.string()),
  propertyUse: v.optional(v.string()),
  situation: v.optional(v.string()),
  roadType: v.optional(v.string()),
  taxRateZone: v.optional(v.string()),
  plotSqft: v.optional(v.number()),
  plinthSqft: v.optional(v.number()),
  municipalWaterConnection: v.optional(v.boolean()),
  waterSource: v.optional(v.string()),
  sanitationType: v.optional(v.string()),
  municipalWasteCollection: v.optional(v.boolean()),
  electricityNo: v.optional(v.string()),
  owners: v.optional(
    v.array(
      v.object({
        name: v.optional(v.string()),
        fatherOrHusbandName: v.optional(v.string()),
        mobileNo: v.optional(v.string()),
        altMobileNo: v.optional(v.string()),
      }),
    ),
  ),
});

const importFloorRow = v.object({
  propertyId: v.string(),
  clientFloorId: v.string(),
  position: v.number(),
  floorName: v.string(),
  usageFactor: v.optional(v.string()),
  usageType: v.string(),
  constructionType: v.string(),
  isOccupied: v.optional(v.boolean()),
  areaSqft: v.number(),
});

/** Re-import survey + floor rows from Excel (supervisor/admin). Matches by Property ID or Local ID. */
export const importExcelBundle = mutation({
  args: {
    surveys: v.array(importSurveyRow),
    floors: v.optional(v.array(importFloorRow)),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    requireRole(me, "supervisor", "admin");

    let created = 0;
    let updated = 0;
    const errors: { propertyId?: string; localId?: string; message: string }[] = [];
    const propertyIdToSurveyId = new Map<string, Id<"surveys">>();

    for (const row of args.surveys) {
      try {
        const muni = await ctx.db.get(row.municipalityId);
        if (!muni) {
          errors.push({ localId: row.localId, message: "Unknown municipality" });
          continue;
        }
        await assertMunicipalityInScope(ctx, me, row.municipalityId);
        if (row.wardNo) assertCanReadWard(me, row.municipalityId, row.wardNo);

        let existing: Doc<"surveys"> | null = null;
        const pid = row.propertyId?.trim().toUpperCase();
        if (pid) {
          existing =
            (await ctx.db
              .query("surveys")
              .withIndex("by_property_id", (q) => q.eq("propertyId", pid))
              .first()) ?? null;
        }
        if (!existing) {
          existing =
            (await ctx.db
              .query("surveys")
              .withIndex("by_surveyor_localId", (q) => q.eq("surveyorId", me._id).eq("localId", row.localId))
              .unique()) ?? null;
        }

        const merged = mergeDraftArgs(
          existing,
          {
            localId: row.localId,
            municipalityId: row.municipalityId,
            clientUpdatedAt: Date.now(),
            wardNo: row.wardNo,
            sectorNo: row.sectorNo,
            oldPropertyNo: row.oldPropertyNo,
            propertyId: pid,
            parcelNo: row.parcelNo,
            unitNo: row.unitNo,
            constructedYear: row.constructedYear,
            isSlum: row.isSlum,
            respondentName: row.respondentName,
            relationship: row.relationship,
            owners: row.owners,
            familySize: row.familySize,
            mobileNo: row.mobileNo,
            altMobileNo: row.altMobileNo,
            houseNo: row.houseNo,
            locality: row.locality,
            colonyName: row.colonyName,
            pinCode: row.pinCode,
            city: row.city ?? muni.name,
            assessmentYear: row.assessmentYear,
            ownershipType: row.ownershipType,
            propertyType: row.propertyType,
            propertyUse: row.propertyUse,
            situation: row.situation,
            roadType: row.roadType,
            taxRateZone: row.taxRateZone,
            plotSqft: row.plotSqft,
            plinthSqft: row.plinthSqft,
            municipalWaterConnection: row.municipalWaterConnection,
            waterSource: row.waterSource as Doc<"surveys">["waterSource"],
            sanitationType: row.sanitationType as Doc<"surveys">["sanitationType"],
            municipalWasteCollection: row.municipalWasteCollection,
            electricityNo: row.electricityNo,
          },
          muni,
        );

        const normalized = normalizeAddressFields(
          normalizeOwnerFields(withResolvedPropertyId(normalizePropertyFields(merged), muni.code)),
          muni,
        );

        const writable = {
          ...stripLocalId(normalized as Parameters<typeof stripLocalId>[0]),
          districtId: muni.districtId,
        };

        if (existing) {
          await ctx.db.patch(existing._id, {
            ...writable,
            serverVersion: existing.serverVersion + 1,
            clientUpdatedAt: Date.now(),
          });
          updated++;
          if (normalized.propertyId) propertyIdToSurveyId.set(normalized.propertyId, existing._id);
        } else {
          const newId = await ctx.db.insert("surveys", {
            ...writable,
            surveyorId: me._id,
            localId: row.localId,
            status: "draft",
            qcStatus: "pending",
            serverVersion: 1,
            clientUpdatedAt: Date.now(),
          } as Doc<"surveys">);
          created++;
          if (normalized.propertyId) propertyIdToSurveyId.set(normalized.propertyId, newId);
        }
      } catch (e) {
        errors.push({
          localId: row.localId,
          propertyId: row.propertyId,
          message: e instanceof Error ? e.message : "Import failed",
        });
      }
    }

    for (const fl of args.floors ?? []) {
      const pid = fl.propertyId.trim().toUpperCase();
      let surveyId = propertyIdToSurveyId.get(pid);
      if (!surveyId) {
        const s = await ctx.db
          .query("surveys")
          .withIndex("by_property_id", (q) => q.eq("propertyId", pid))
          .first();
        surveyId = s?._id;
      }
      if (!surveyId) {
        errors.push({ propertyId: pid, message: "Floor row: survey not found for Property ID" });
        continue;
      }
      const survey = await ctx.db.get(surveyId);
      if (!survey) continue;
      assertCanReadWard(me, survey.municipalityId, survey.wardNo);

      const normalized = normalizeFloorFields({ usageFactor: fl.usageFactor, usageType: fl.usageType });
      const floorErrors = validateFloorRow({
        floorName: fl.floorName,
        usageFactor: normalized.usageFactor || undefined,
        usageType: normalized.usageType,
        constructionType: fl.constructionType,
        areaSqft: fl.areaSqft,
      });
      if (Object.keys(floorErrors).length > 0) {
        errors.push({ propertyId: pid, message: "Invalid floor row" });
        continue;
      }

      const existing = await ctx.db
        .query("floors")
        .withIndex("by_survey_clientFloorId", (q) => q.eq("surveyId", surveyId!).eq("clientFloorId", fl.clientFloorId))
        .unique();

      const floorDoc = {
        position: fl.position,
        floorName: fl.floorName,
        usageFactor: normalized.usageFactor || undefined,
        usageType: normalized.usageType,
        constructionType: fl.constructionType,
        isOccupied: fl.isOccupied ?? usageTypeToOccupied(normalized.usageType),
        areaSqft: fl.areaSqft,
      };

      if (existing) {
        await ctx.db.patch(existing._id, floorDoc);
      } else {
        await ctx.db.insert("floors", { surveyId: surveyId!, clientFloorId: fl.clientFloorId, ...floorDoc });
      }
    }

    await writeAudit(ctx, {
      actorId: me._id,
      action: "survey.excel_import",
      entity: "survey",
      entityId: me._id,
      metadata: { created, updated, errorCount: errors.length },
    });

    return { created, updated, errors };
  },
});
