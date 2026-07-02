"use client";

import { KpiMetricsSection } from "@/components/dashboard/kpi-metrics-section";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/** Client-side KPI subscription when server preload fails. */
export function DashboardKpisFallback({ nowMs }: { nowMs: number }) {
  const counts = useQuery(api.webDashboard.counts, { nowMs });
  return <KpiMetricsSection counts={counts} />;
}
