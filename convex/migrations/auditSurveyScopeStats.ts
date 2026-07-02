import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalQuery } from "../_generated/server";
import { municipalityStatsRowLooksConsistent } from "../lib/surveyScopeStats";

const inconsistencyRow = v.object({
  municipalityId: v.id("municipalities"),
  statsTotal: v.number(),
  liveTotal: v.number(),
  drafts: v.number(),
  qcPending: v.number(),
  qcApproved: v.number(),
  qcRejected: v.number(),
  submitted: v.number(),
});

/**
 * Compare denormalized municipality stats against live survey counts.
 * Run: `npx convex run migrations/auditSurveyScopeStats:audit --prod`
 */
export const audit = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    checked: v.number(),
    inconsistentCount: v.number(),
    inconsistent: v.array(inconsistencyRow),
  }),
  handler: async (ctx, args) => {
    const maxRows = args.limit ?? 500;
    const inconsistent: Array<{
      municipalityId: Id<"municipalities">;
      statsTotal: number;
      liveTotal: number;
      drafts: number;
      qcPending: number;
      qcApproved: number;
      qcRejected: number;
      submitted: number;
    }> = [];

    let checked = 0;
    for await (const row of ctx.db.query("surveyMunicipalityStats")) {
      if (checked >= maxRows) break;
      checked++;

      const rollup = {
        municipalityId: row.municipalityId,
        total: row.total,
        drafts: row.drafts,
        submitted: row.submitted,
        qcApproved: row.qcApproved,
        qcRejected: row.qcRejected,
        qcPending: row.qcPending,
      };

      const liveRows = await ctx.db
        .query("surveys")
        .withIndex("by_municipality_status", (q) => q.eq("municipalityId", row.municipalityId))
        .collect();

      const liveTotal = liveRows.length;
      const looksConsistent = municipalityStatsRowLooksConsistent(rollup) && row.total === liveTotal;

      if (!looksConsistent) {
        inconsistent.push({
          municipalityId: row.municipalityId,
          statsTotal: row.total,
          liveTotal,
          drafts: row.drafts,
          qcPending: row.qcPending,
          qcApproved: row.qcApproved,
          qcRejected: row.qcRejected,
          submitted: row.submitted,
        });
      }
    }

    return {
      checked,
      inconsistentCount: inconsistent.length,
      inconsistent,
    };
  },
});

/**
 * Aggregate KPI math check across all municipality stats rows.
 * Run: `node ./scripts/run-convex-prod.mjs run migrations/auditSurveyScopeStats:verifyKpiTotals '{}'`
 */
export const verifyKpiTotals = internalQuery({
  args: {},
  returns: v.object({
    municipalityCount: v.number(),
    liveSurveyTotal: v.number(),
    statsTotal: v.number(),
    statsDrafts: v.number(),
    statsPending: v.number(),
    statsApproved: v.number(),
    statsRejected: v.number(),
    kpiStatusSum: v.number(),
    totalsMatchLive: v.boolean(),
    kpiMathConsistent: v.boolean(),
  }),
  handler: async (ctx) => {
    let statsTotal = 0;
    let statsDrafts = 0;
    let statsPending = 0;
    let statsApproved = 0;
    let statsRejected = 0;
    let municipalityCount = 0;

    for await (const row of ctx.db.query("surveyMunicipalityStats")) {
      municipalityCount++;
      statsTotal += row.total;
      statsDrafts += row.drafts;
      statsPending += row.qcPending;
      statsApproved += row.qcApproved;
      statsRejected += row.qcRejected;
    }

    const liveSurveyTotal = (await ctx.db.query("surveys").collect()).length;
    const kpiStatusSum = statsDrafts + statsPending + statsApproved + statsRejected;

    return {
      municipalityCount,
      liveSurveyTotal,
      statsTotal,
      statsDrafts,
      statsPending,
      statsApproved,
      statsRejected,
      kpiStatusSum,
      totalsMatchLive: statsTotal === liveSurveyTotal,
      kpiMathConsistent: statsTotal >= kpiStatusSum,
    };
  },
});
