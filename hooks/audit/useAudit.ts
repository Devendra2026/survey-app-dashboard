"use client";
/** Audit hooks — bound to the additive audit.* read queries. */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasCapability } from "@/hooks/use-capability";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { useQuery } from "convex/react";
import { useMemo } from "react";

export type AuditFilterFacets = {
  actions: string[];
  entities: string[];
};

/** Supports legacy deployments that returned `string[]` before facets were combined. */
function normalizeFacets(raw: string[] | AuditFilterFacets | undefined): AuditFilterFacets | undefined {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return { actions: raw, entities: [] };
  return raw;
}

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

export type AuditListFilters = {
  entity?: string;
  action?: string;
};

export function useAuditLogPaginated(filters: AuditListFilters = {}, pageSize = 15) {
  const allowed = useHasCapability("audit.view");
  const resetKey = `${filters.action ?? ""}|${filters.entity ?? ""}`;
  const {
    cursor,
    pageIndex,
    pageSize: size,
    canGoPrev,
    goNext,
    goPrev,
    pageNumber,
  } = useCursorPagination(resetKey, pageSize);

  const result = useQuery(
    api.audit.listPaginated,
    allowed
      ? {
          paginationOpts: { numItems: size, cursor },
          entity: filters.entity,
          action: filters.action,
        }
      : "skip",
  );

  const rows = result?.page;
  const canGoNext = result ? !result.isDone : false;

  return useMemo(
    () => ({
      rows,
      isLoading: result === undefined,
      pageNumber,
      pageIndex,
      pageSize: size,
      canGoPrev,
      canGoNext,
      goNext: () => {
        if (result) goNext(result.continueCursor, result.isDone);
      },
      goPrev,
    }),
    [rows, result, pageNumber, pageIndex, size, canGoPrev, canGoNext, goNext, goPrev],
  );
}

export function useAuditFacets() {
  const allowed = useHasCapability("audit.view");
  const raw = useQuery(api.audit.actionFacets, allowed ? {} : "skip");
  return useMemo(() => normalizeFacets(raw), [raw]);
}

export function useAuditSummary() {
  const allowed = useHasCapability("audit.view");
  return useQuery(api.audit.summary, allowed ? {} : "skip");
}
