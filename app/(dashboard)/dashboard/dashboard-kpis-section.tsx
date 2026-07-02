import { DashboardKpisClient } from "@/app/(dashboard)/dashboard/dashboard-kpis-client";
import { DashboardKpisFallback } from "@/app/(dashboard)/dashboard/dashboard-kpis-fallback";
import { preloadDashboardCounts } from "@/lib/convex-server";

export async function DashboardKpisSection({ nowMs }: { nowMs: number }) {
  try {
    const preloadedCounts = await preloadDashboardCounts(nowMs);
    return <DashboardKpisClient preloadedCounts={preloadedCounts} />;
  } catch (error) {
    console.error("[dashboard] KPI preload failed", error);
    return <DashboardKpisFallback nowMs={nowMs} />;
  }
}
