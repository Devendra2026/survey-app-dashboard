import { DashboardKpisClient } from "@/app/(dashboard)/dashboard/dashboard-kpis-client";
import { preloadDashboardHome } from "@/lib/convex-server";

export async function DashboardKpisSection({ nowMs }: { nowMs: number }) {
  const preloadedHome = await preloadDashboardHome(nowMs);
  return <DashboardKpisClient preloadedHome={preloadedHome} />;
}
