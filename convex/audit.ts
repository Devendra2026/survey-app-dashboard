/**
 * audit.ts — READ surface over the existing `auditLogs` table.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS (and why it does not break the "reuse, don't fork" rule)
 * ─────────────────────────────────────────────────────────────────────────
 * The mobile backend writes audit rows through `helpers.writeAudit` from every
 * mutation, but it never exposed a *read* query — the mobile app has no audit
 * screen. The web Audit module needs one. Per the brief:
 *
 *     "Reuse existing Convex functions. Create server-side mutations and
 *      queries only when missing. All permissions must be enforced on the
 *      server."
 *
 * This module ADDS a read query only. It:
 *   • introduces no new table and changes no field name,
 *   • writes nothing (append-only invariant of `auditLogs` is preserved),
 *   • reuses the exact same `requireUser` / `requireRole` helpers,
 *   • uses the indexes already declared on `auditLogs` (by_entity, by_actor).
 *
 * It is therefore an interface-only addition over the source-of-truth schema.
 */
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { mapTruthyById, requireRole, requireUser } from "./helpers";

async function hydrateAuditRows(ctx: QueryCtx, rows: Doc<"auditLogs">[]) {
  const actorIdSet = new Set<Id<"users">>();
  for (const row of rows) {
    if (row.actorId) actorIdSet.add(row.actorId);
  }
  const actors = await Promise.all([...actorIdSet].map((id) => ctx.db.get(id)));
  const byId = mapTruthyById(actors);

  return rows.map((r) => ({
    _id: r._id,
    _creationTime: r._creationTime,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId ?? null,
    metadata: r.metadata ?? null,
    actor: r.actorId
      ? byId.get(r.actorId)
        ? { _id: r.actorId, name: byId.get(r.actorId)!.name, email: byId.get(r.actorId)!.email }
        : { _id: r.actorId, name: "Unknown", email: "" }
      : null,
  }));
}

function auditQuery(ctx: QueryCtx, args: { entity?: string; entityId?: string; actorId?: Id<"users"> }) {
  if (args.entity) {
    return ctx.db
      .query("auditLogs")
      .withIndex("by_entity", (q) =>
        args.entityId ? q.eq("entity", args.entity!).eq("entityId", args.entityId) : q.eq("entity", args.entity!),
      );
  }
  if (args.actorId) {
    return ctx.db.query("auditLogs").withIndex("by_actor", (q) => q.eq("actorId", args.actorId!));
  }
  return ctx.db.query("auditLogs");
}

/**
 * Paginated, filterable audit feed. Admin-only — matches the role matrix
 * (only ADMIN has "View audit logs").
 *
 * Filters mirror the index shapes so we never force a table scan when a
 * caller narrows by entity or actor.
 */
export const list = query({
  args: {
    entity: v.optional(v.string()),
    entityId: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
    action: v.optional(v.string()), // exact match on action verb, e.g. "survey.approved"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    requireRole(me, "admin");

    const limit = Math.min(args.limit ?? 100, 500);

    let rows = await auditQuery(ctx, args)
      .order("desc")
      .take(limit * 2);

    if (args.action) {
      rows = rows.filter((r) => r.action === args.action);
    }
    rows = rows.slice(0, limit);

    return hydrateAuditRows(ctx, rows);
  },
});

/** Cursor-paginated audit feed — fetches one page at a time for fast UI render. */
export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    entity: v.optional(v.string()),
    entityId: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    requireRole(me, "admin");

    const page = await auditQuery(ctx, args).order("desc").paginate(args.paginationOpts);
    let rows = page.page;
    if (args.action) {
      rows = rows.filter((r) => r.action === args.action);
    }

    return {
      ...page,
      page: await hydrateAuditRows(ctx, rows),
    };
  },
});

/** Lightweight KPI stats — scans a recent window instead of hydrating the full feed. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    requireRole(me, "admin");

    const recent = await ctx.db.query("auditLogs").order("desc").take(1000);
    const now = Date.now();
    const dayMs = 86_400_000;

    return {
      total: recent.length,
      capped: recent.length === 1000,
      actions: new Set(recent.map((r) => r.action)).size,
      entities: new Set(recent.map((r) => r.entity)).size,
      today: recent.filter((r) => now - r._creationTime < dayMs).length,
    };
  },
});

/** Distinct action + entity values — drives both filter dropdowns in one round trip. */
export const actionFacets = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    requireRole(me, "admin");
    const rows = await ctx.db.query("auditLogs").order("desc").take(1000);
    return {
      actions: Array.from(new Set(rows.map((r) => r.action))).sort(),
      entities: Array.from(new Set(rows.map((r) => r.entity))).sort(),
    };
  },
});
