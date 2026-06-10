/**
 * Dynamic tax rate configuration per municipality (ULB).
 *
 * Rate model:
 *   ALV = area × rateMatrix[zone][constructionType] × roadTypeFactors[roadType] × usageMultipliers[usage]
 *   Tax = ALV × propertyTaxPct
 *
 * Admin sets these from Masters → Tax Rates. Falls back to system defaults when no row exists.
 */
import { v } from "convex/values";
import {
  DEFAULT_RATE_MATRIX,
  DEFAULT_ROAD_TYPE_FACTORS,
  DEFAULT_TAX_RATES,
  DEFAULT_USAGE_MULTIPLIERS,
} from "../lib/qc/tax-rate-defaults";
import { mutation, query } from "./_generated/server";
import { clientError, requireRole, requireUser, writeAudit } from "./helpers";

export { DEFAULT_RATE_MATRIX, DEFAULT_ROAD_TYPE_FACTORS, DEFAULT_TAX_RATES, DEFAULT_USAGE_MULTIPLIERS };

/** Returns the rate config for a ULB, or null (caller should use defaults). */
export const getForMunicipality = query({
  args: { municipalityId: v.id("municipalities") },
  handler: async (ctx, { municipalityId }) => {
    return ctx.db
      .query("taxRates")
      .withIndex("by_municipality", (q) => q.eq("municipalityId", municipalityId))
      .unique();
  },
});

/** Admin overview — all municipalities with their rate status. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    requireRole(me, "admin");

    const [municipalities, rates] = await Promise.all([
      ctx.db.query("municipalities").collect(),
      ctx.db.query("taxRates").collect(),
    ]);

    const ratesByMuni = new Map(rates.map((r) => [r.municipalityId, r]));

    return municipalities.map((m) => ({
      municipality: m,
      rates: ratesByMuni.get(m._id) ?? null,
    }));
  },
});

/** Admin: set or replace the rate config for a specific municipality. */
export const upsert = mutation({
  args: {
    municipalityId: v.id("municipalities"),
    rateMatrix: v.record(v.string(), v.record(v.string(), v.number())),
    roadTypeFactors: v.record(v.string(), v.number()),
    propertyTaxPct: v.number(),
    waterTaxPct: v.number(),
    drainageTaxPct: v.number(),
    usageMultipliers: v.record(v.string(), v.number()),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    requireRole(me, "admin");

    const muni = await ctx.db.get(args.municipalityId);
    if (!muni) clientError("BAD_REQUEST", "Unknown municipality");

    if (args.propertyTaxPct < 0 || args.propertyTaxPct > 1)
      clientError("BAD_REQUEST", "Property tax must be 0–1 (e.g. 0.10 = 10%)");
    if (args.waterTaxPct < 0 || args.waterTaxPct > 1)
      clientError("BAD_REQUEST", "Water tax must be 0–1");
    if (args.drainageTaxPct < 0 || args.drainageTaxPct > 1)
      clientError("BAD_REQUEST", "Drainage tax must be 0–1");

    const existing = await ctx.db
      .query("taxRates")
      .withIndex("by_municipality", (q) => q.eq("municipalityId", args.municipalityId))
      .unique();

    const payload = {
      municipalityId: args.municipalityId,
      rateMatrix: args.rateMatrix,
      roadTypeFactors: args.roadTypeFactors,
      propertyTaxPct: args.propertyTaxPct,
      waterTaxPct: args.waterTaxPct,
      drainageTaxPct: args.drainageTaxPct,
      usageMultipliers: args.usageMultipliers,
      updatedBy: me._id,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      await writeAudit(ctx, {
        actorId: me._id,
        action: "taxRates.updated",
        entity: "taxRates",
        entityId: existing._id,
        metadata: { municipalityId: args.municipalityId, municipalityName: muni.name },
      });
      return existing._id;
    }

    const id = await ctx.db.insert("taxRates", payload);
    await writeAudit(ctx, {
      actorId: me._id,
      action: "taxRates.created",
      entity: "taxRates",
      entityId: id,
      metadata: { municipalityId: args.municipalityId, municipalityName: muni.name },
    });
    return id;
  },
});

/** Admin: delete custom config so system defaults apply again. */
export const resetToDefaults = mutation({
  args: { municipalityId: v.id("municipalities") },
  handler: async (ctx, { municipalityId }) => {
    const me = await requireUser(ctx);
    requireRole(me, "admin");

    const existing = await ctx.db
      .query("taxRates")
      .withIndex("by_municipality", (q) => q.eq("municipalityId", municipalityId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await writeAudit(ctx, {
        actorId: me._id,
        action: "taxRates.reset",
        entity: "taxRates",
        entityId: existing._id,
        metadata: { municipalityId },
      });
    }
  },
});
