"use client";
/** Master-data admin hooks — bound to admin.upsertMaster / admin.deleteMaster.
 *  NOTE: the existing upsert/delete do NOT write audit rows (see docs). We use
 *  them as-is to honour "reuse existing / don't fork business logic". */
import { api } from "@/convex/_generated/api";
import { useHasCapability } from "@/hooks/use-capability";
import { useMutation, useQuery } from "convex/react";

export function useUpsertMaster() {
  return useMutation(api.admin.upsertMaster);
}
export function useDeleteMaster() {
  return useMutation(api.admin.deleteMaster);
}
/** Raw rows for one category (incl. inactive + position) — additive admin read. */
export function useMasterCategory(category: string | undefined) {
  const allowed = useHasCapability("masters.manage");
  return useQuery(api.masterCatalog.listByCategory, allowed && category ? { category } : "skip");
}
