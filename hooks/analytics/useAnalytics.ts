"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasCapability } from "@/hooks/use-capability";
import { useClientNowMs } from "@/hooks/use-client-now";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { useQuery } from "convex/react";
import { useMemo } from "react";

export function useDashboardCounts() {
  const ready = useConvexAuthReady();
  const nowMs = useClientNowMs();
  const queryArgs = useMemo((): "skip" | { nowMs: number } => {
    if (!ready || !Number.isFinite(nowMs)) return "skip";
    return { nowMs };
  }, [ready, nowMs]);
  return useQuery(api.masters.dashboardCounts, queryArgs);
}

export function useStatsBreakdown(filters: { districtId?: string; municipalityId?: string; surveyorId?: string } = {}) {
  const ready = useConvexAuthReady();
  const allowed = useHasCapability("analytics.view");
  const nowMs = useClientNowMs();
  const queryArgs = useMemo(():
    | "skip"
    | {
        districtId: Id<"districts"> | undefined;
        municipalityId: Id<"municipalities"> | undefined;
        surveyorId: Id<"users"> | undefined;
        nowMs: number;
      } => {
    if (!ready || !allowed || !Number.isFinite(nowMs)) return "skip";
    return {
      districtId: filters.districtId as Id<"districts"> | undefined,
      municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
      surveyorId: filters.surveyorId as Id<"users"> | undefined,
      nowMs,
    };
  }, [ready, allowed, nowMs, filters.districtId, filters.municipalityId, filters.surveyorId]);
  return useQuery(api.analytics.surveyStatsBreakdown, queryArgs);
}

/** Additive (analyticsTrends.ts) — daily survey/approval trend. */
export function useDailyTrend(days = 30, filters: { districtId?: string; municipalityId?: string } = {}) {
  const ready = useConvexAuthReady();
  const allowed = useHasCapability("analytics.view");
  const nowMs = useClientNowMs();
  const queryArgs = useMemo(():
    | "skip"
    | {
        days: number;
        districtId: Id<"districts"> | undefined;
        municipalityId: Id<"municipalities"> | undefined;
        nowMs: number;
      } => {
    if (!ready || !allowed || !Number.isFinite(nowMs)) return "skip";
    return {
      days,
      districtId: filters.districtId as Id<"districts"> | undefined,
      municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
      nowMs,
    };
  }, [ready, allowed, nowMs, days, filters.districtId, filters.municipalityId]);
  return useQuery(api.analyticsTrends.dailyTrend, queryArgs);
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
