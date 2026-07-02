import { DashboardActivityClient } from "@/app/(dashboard)/dashboard/dashboard-activity-client";
import { preloadDashboardActivity } from "@/lib/convex-server";

export async function DashboardActivitySection() {
  const preloadedActivity = await preloadDashboardActivity();
  return <DashboardActivityClient preloadedActivity={preloadedActivity} />;
}
