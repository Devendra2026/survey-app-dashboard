"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { useQuery } from "convex/react";

export function useDashboardCounts() {
  const ready = useConvexAuthReady();
  return useQuery(api.masters.dashboardCounts, ready ? {} : "skip");
}

export function useStatsBreakdown(filters: { districtId?: string; municipalityId?: string; surveyorId?: string } = {}) {
  const ready = useConvexAuthReady();
  return useQuery(
    api.analytics.surveyStatsBreakdown,
    ready
      ? {
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
          surveyorId: filters.surveyorId as Id<"users"> | undefined,
        }
      : "skip",
  );
}

/** Additive (analyticsTrends.ts) — daily survey/approval trend. */
export function useDailyTrend(days = 30, filters: { districtId?: string; municipalityId?: string } = {}) {
  const ready = useConvexAuthReady();
  return useQuery(
    api.analyticsTrends.dailyTrend,
    ready
      ? {
          days,
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
        }
      : "skip",
  );
}

/** Additive (analyticsTrends.ts) — ward coverage. */
export function useWardCoverage(filters: { districtId?: string; municipalityId?: string } = {}) {
  const ready = useConvexAuthReady();
  return useQuery(
    api.analyticsTrends.wardCoverage,
    ready
      ? {
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
        }
      : "skip",
  );
}
