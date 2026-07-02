import { DashboardAnalyticsClient } from "@/app/(dashboard)/dashboard/dashboard-analytics-client";
import { DashboardAnalyticsFallback } from "@/app/(dashboard)/dashboard/dashboard-analytics-fallback";
import { preloadDashboardAnalytics } from "@/lib/convex-server";

export async function DashboardAnalyticsSection({ nowMs }: { nowMs: number }) {
  try {
    const preloadedAnalytics = await preloadDashboardAnalytics(nowMs);
    return <DashboardAnalyticsClient preloadedAnalytics={preloadedAnalytics} />;
  } catch (error) {
    console.error("[dashboard] analytics preload failed", error);
    return <DashboardAnalyticsFallback nowMs={nowMs} />;
  }
}
