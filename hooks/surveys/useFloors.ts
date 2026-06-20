"use client";
/** Floor hooks — bound to floors.* (list/upsert/remove/reorder). */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { useMutation, useQuery } from "convex/react";

export function useFloors(surveyId: string | undefined) {
  const ready = useConvexAuthReady();
  return useQuery(api.floors.list, ready && surveyId ? { surveyId: surveyId as Id<"surveys"> } : "skip");
}
export function useUpsertFloor() {
  return useMutation(api.floors.upsert);
}
export function useRemoveFloor() {
  return useMutation(api.floors.remove);
}
function useReorderFloors() {
  return useMutation(api.floors.reorder);
}
