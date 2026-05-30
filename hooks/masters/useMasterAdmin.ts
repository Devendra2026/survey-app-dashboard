"use client";
/** Master-data admin hooks — bound to admin.upsertMaster / admin.deleteMaster.
 *  NOTE: the existing upsert/delete do NOT write audit rows (see docs). We use
 *  them as-is to honour "reuse existing / don't fork business logic". */
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

import { useQuery } from "convex/react";

export function useUpsertMaster() {
  return useMutation(api.admin.upsertMaster);
}
export function useDeleteMaster() {
  return useMutation(api.admin.deleteMaster);
}
/** Raw rows for one category (incl. inactive + position) — additive admin read. */
export function useMasterCategory(category: string | undefined) {
  return useQuery(api.masterCatalog.listByCategory, category ? { category } : "skip");
}
