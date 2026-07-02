"use client";

import { KpiMetricsSection } from "@/components/dashboard/kpi-metrics-section";
import { api } from "@/convex/_generated/api";
import { useDashboardHome } from "@/hooks/analytics/useAnalytics";
import type { Preloaded } from "convex/react";

export function DashboardKpisClient({
  preloadedHome,
}: {
  preloadedHome: Preloaded<typeof api.webDashboard.homeBundle>;
}) {
  const home = useDashboardHome(preloadedHome);
  return <KpiMetricsSection counts={home?.counts} />;
}
