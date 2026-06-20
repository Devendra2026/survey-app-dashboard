"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasCapability } from "@/hooks/use-capability";
import { useClientNowMs } from "@/hooks/use-client-now";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { useQuery } from "convex/react";

export function useDashboardCounts() {
  const ready = useConvexAuthReady();
  const nowMs = useClientNowMs();
  return useQuery(api.masters.dashboardCounts, ready ? { nowMs } : "skip");
}

export function useStatsBreakdown(filters: { districtId?: string; municipalityId?: string; surveyorId?: string } = {}) {
  const ready = useConvexAuthReady();
  const allowed = useHasCapability("analytics.view");
  const nowMs = useClientNowMs();
  return useQuery(
    api.analytics.surveyStatsBreakdown,
    ready && allowed
      ? {
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
          surveyorId: filters.surveyorId as Id<"users"> | undefined,
          nowMs,
        }
      : "skip",
  );
}

/** Additive (analyticsTrends.ts) — daily survey/approval trend. */
export function useDailyTrend(days = 30, filters: { districtId?: string; municipalityId?: string } = {}) {
  const ready = useConvexAuthReady();
  const allowed = useHasCapability("analytics.view");
  const nowMs = useClientNowMs();
  return useQuery(
    api.analyticsTrends.dailyTrend,
    ready && allowed
      ? {
          days,
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
          nowMs,
        }
      : "skip",
  );
}

/** Additive (analyticsTrends.ts) — ward coverage. */
export function useWardCoverage(filters: { districtId?: string; municipalityId?: string } = {}) {
  const ready = useConvexAuthReady();
  const allowed = useHasCapability("analytics.view");
  return useQuery(
    api.analyticsTrends.wardCoverage,
    ready && allowed
      ? {
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
        }
      : "skip",
  );
}
