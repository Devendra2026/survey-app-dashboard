"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasCapability } from "@/hooks/use-capability";
import { useClientNowMs } from "@/hooks/use-client-now";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import type { WebDashboardAnalytics } from "@/schema/analytics";
import { type Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { useMemo } from "react";

/** KPI counts hydrated from a server `preloadQuery` payload. */
export function useDashboardCounts(preloaded: Preloaded<typeof api.webDashboard.counts>) {
  return usePreloadedQuery(preloaded);
}

/** Analytics bundle for charts — separate subscription from KPI counts. */
export function useDashboardAnalytics(trendDays = 30) {
  const ready = useConvexAuthReady();
  const nowMs = useClientNowMs();
  const queryArgs = useMemo((): "skip" | { nowMs: number; trendDays: number } => {
    if (!ready || !Number.isFinite(nowMs)) return "skip";
    return { nowMs, trendDays };
  }, [ready, nowMs, trendDays]);

  return useQuery(api.webDashboard.analyticsBundle, queryArgs) as WebDashboardAnalytics | null | undefined;
}

/** Lightweight activity feed rows for the home dashboard (web only). */
export function useRecentActivity(enabled = true) {
  const ready = useConvexAuthReady();
  return useQuery(api.webDashboard.recentActivity, ready && enabled ? {} : "skip");
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
