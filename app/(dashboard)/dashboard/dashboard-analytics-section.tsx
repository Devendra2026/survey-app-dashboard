import { DashboardAnalyticsClient } from "@/app/(dashboard)/dashboard/dashboard-analytics-client";
import { preloadDashboardHome } from "@/lib/convex-server";

export async function DashboardAnalyticsSection({ nowMs }: { nowMs: number }) {
  const preloadedHome = await preloadDashboardHome(nowMs);
  return <DashboardAnalyticsClient preloadedHome={preloadedHome} />;
}
