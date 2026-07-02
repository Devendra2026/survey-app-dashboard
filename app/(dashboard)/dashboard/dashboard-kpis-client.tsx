"use client";

import { KpiMetricsSection } from "@/components/dashboard/kpi-metrics-section";
import { api } from "@/convex/_generated/api";
import { useDashboardCounts } from "@/hooks/analytics/useAnalytics";
import type { Preloaded } from "convex/react";

export function DashboardKpisClient({
  preloadedCounts,
}: {
  preloadedCounts: Preloaded<typeof api.webDashboard.counts>;
}) {
  const counts = useDashboardCounts(preloadedCounts);
  return <KpiMetricsSection counts={counts} />;
}
