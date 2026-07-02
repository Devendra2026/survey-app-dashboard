import { DashboardPageClient } from "@/app/(dashboard)/dashboard/dashboard-client";
import { api } from "@/convex/_generated/api";
import { preloadConvexQuery } from "@/lib/convex-server";

export default async function DashboardPage() {
  const nowMs = Date.now();
  const preloadedCounts = await preloadConvexQuery(api.webDashboard.counts, { nowMs });

  return <DashboardPageClient preloadedCounts={preloadedCounts} />;
}
