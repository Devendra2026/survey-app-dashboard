"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasCapability } from "@/hooks/use-capability";
import { useClientNowMs } from "@/hooks/use-client-now";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import type { DashboardCounts, WebDashboardAnalytics } from "@/schema/analytics";
import { useQuery, useQuery_experimental } from "convex/react";
import { useMemo } from "react";

/** Single-query home dashboard bundle (web only) — one scoped survey scan. */
export function useWebDashboardBundle(trendDays = 30) {
  const ready = useConvexAuthReady();
  const nowMs = useClientNowMs();
  const queryArgs = useMemo((): "skip" | { nowMs: number; trendDays: number } => {
    if (!ready || !Number.isFinite(nowMs)) return "skip";
    return { nowMs, trendDays };
  }, [ready, nowMs, trendDays]);

  const bundleState = useQuery_experimental({
    query: api.webDashboard.homeBundle,
    args: queryArgs,
  });

  const useFallback = bundleState.status === "error";
  const fallbackArgs = useMemo((): "skip" | { nowMs: number } => {
    if (!useFallback || !ready || !Number.isFinite(nowMs)) return "skip";
    return { nowMs };
  }, [useFallback, ready, nowMs]);

  const fallbackCounts = useQuery(api.masters.dashboardCounts, fallbackArgs);

  const bundle = bundleState.status === "success" ? bundleState.data : undefined;
  const counts = bundle?.counts ?? (useFallback ? (fallbackCounts as DashboardCounts | undefined) : undefined);

  return {
    counts,
    analytics: bundle?.analytics as WebDashboardAnalytics | null | undefined,
    isLoading: bundleState.status === "pending" || (useFallback && fallbackCounts === undefined),
    error: bundleState.status === "error" ? bundleState.error : null,
    analyticsUnavailable: useFallback,
  };
}

/** Lightweight activity feed rows for the home dashboard (web only). */
export function useRecentActivity(enabled = true) {
  const ready = useConvexAuthReady();
  const activityState = useQuery_experimental({
    query: api.webDashboard.recentActivity,
    args: ready && enabled ? {} : "skip",
  });

  if (activityState.status === "success") return activityState.data;
  if (activityState.status === "error") return [];
  return undefined;
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
