"use client";
/** Audit hooks — bound to the additive audit.* read queries. */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasCapability } from "@/hooks/use-capability";
import { useQuery } from "convex/react";

export function useAuditLog(
  filters: { entity?: string; entityId?: string; actorId?: string; action?: string; limit?: number } = {},
) {
  const allowed = useHasCapability("audit.view");
  return useQuery(
    api.audit.list,
    allowed
      ? {
          entity: filters.entity,
          entityId: filters.entityId,
          actorId: filters.actorId as Id<"users"> | undefined,
          action: filters.action,
          limit: filters.limit ?? 100,
        }
      : "skip",
  );
}
export function useAuditFacets() {
  const allowed = useHasCapability("audit.view");
  return useQuery(api.audit.actionFacets, allowed ? {} : "skip");
}
