"use client";
/** Floor hooks — bound to floors.* (list/upsert/remove/reorder). */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export function useFloors(surveyId: string | undefined) {
  return useQuery(api.floors.list, surveyId ? { surveyId: surveyId as Id<"surveys"> } : "skip");
}
export function useUpsertFloor() {
  return useMutation(api.floors.upsert);
}
export function useRemoveFloor() {
  return useMutation(api.floors.remove);
}
export function useReorderFloors() {
  return useMutation(api.floors.reorder);
}
