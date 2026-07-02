import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { recordSurveyStatsInsert } from "../lib/surveyScopeStats";

const BATCH_SIZE = 100;

/**
 * Backfill denormalized survey scope stats from existing survey rows.
 * Run once: `npx convex run migrations/backfillSurveyScopeStats:run`
 */
export const run = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    processed: v.optional(v.number()),
    reset: v.optional(v.boolean()),
  },
  returns: v.object({
    done: v.boolean(),
    processed: v.number(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    let processed = args.processed ?? 0;

    if (args.reset && !args.cursor) {
      for await (const row of ctx.db.query("surveyMunicipalityStats")) {
        await ctx.db.delete(row._id);
      }
      for await (const row of ctx.db.query("surveyDailyStats")) {
        await ctx.db.delete(row._id);
      }
    }

    const page = await ctx.db.query("surveys").paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    });

    for (const survey of page.page) {
      await recordSurveyStatsInsert(ctx, survey);
      processed++;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillSurveyScopeStats.run, {
        cursor: page.continueCursor,
        processed,
      });
      return { done: false, processed, cursor: page.continueCursor };
    }

    return { done: true, processed, cursor: null };
  },
});
