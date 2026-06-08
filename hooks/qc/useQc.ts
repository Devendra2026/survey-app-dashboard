"use client";
/** QC feature hooks — bound to qc.* (decide / addRemark / resolveRemark / reopen / listRemarks). */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { useMutation, useQuery } from "convex/react";

export function useQcRemarks(surveyId: string | undefined) {
  const ready = useConvexAuthReady();
  return useQuery(api.qc.listRemarks, ready && surveyId ? { surveyId: surveyId as Id<"surveys"> } : "skip");
}

/** Approve OR reject. decision='approve' → status+qcStatus approved.
 *  decision='reject' → qcStatus rejected, status back to 'draft' (re-editable). */
export function useDecide() {
  return useMutation(api.qc.decide);
}

/** "Request correction" = append an open remark; survey stays where it is. */
export function useAddRemark() {
  return useMutation(api.qc.addRemark);
}

export function useResolveRemark() {
  return useMutation(api.qc.resolveRemark);
}

/** Override / re-open an approved survey (admin or supervisor). */
export function useReopen() {
  return useMutation(api.qc.reopen);
}
