import { DashboardActivitySection } from "@/app/(dashboard)/dashboard/dashboard-activity-section";
import { DashboardAnalyticsSection } from "@/app/(dashboard)/dashboard/dashboard-analytics-section";
import { DashboardKpisSection } from "@/app/(dashboard)/dashboard/dashboard-kpis-section";
import { DashboardShell } from "@/app/(dashboard)/dashboard/dashboard-shell";
import { ActivitySkeleton, ChartsSkeleton } from "@/app/(dashboard)/dashboard/skeletons";
import { CardsSkeleton } from "@/components/shared/loading";
import { Suspense } from "react";

export default function DashboardPage() {
  const nowMs = Date.now();

  return (
    <div className="space-y-6 lg:space-y-8">
      <DashboardShell />

      <Suspense fallback={<CardsSkeleton count={5} />}>
        <DashboardKpisSection nowMs={nowMs} />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardAnalyticsSection nowMs={nowMs} />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <DashboardActivitySection />
      </Suspense>
    </div>
  );
}
