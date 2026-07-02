"use client";

import { DashboardAnalyticsView } from "@/app/(dashboard)/dashboard/dashboard-analytics-client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/** Client-side analytics subscription when server preload fails. */
export function DashboardAnalyticsFallback({ nowMs }: { nowMs: number }) {
  const analytics = useQuery(api.webDashboard.analyticsBundle, { nowMs, trendDays: 30 });
  return <DashboardAnalyticsView analytics={analytics ?? null} />;
}
