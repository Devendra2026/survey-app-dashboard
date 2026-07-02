"use client";

import { ChartCardSkeleton } from "@/app/(dashboard)/dashboard/skeletons";
import {
  QcSupervisorProductivityChart,
  SurveyorProductivityChart,
  TrendChart,
} from "@/components/analytics/recharts-charts";
import { SectionHeader } from "@/components/design-system/executive-hero";
import { FadeIn } from "@/components/design-system/motion";
import type { DailyTrendPoint, StatsBreakdown } from "@/schema/analytics";
import { Suspense } from "react";

export function ProductivitySection({
  breakdown,
  trend,
}: {
  breakdown: StatsBreakdown | undefined;
  trend: DailyTrendPoint[] | undefined;
}) {
  return (
    <section aria-labelledby="analytics-heading">
      <SectionHeader title="Productivity Analytics" description="30-day trends and team performance" className="mb-4" />
      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn>
          <Suspense fallback={<ChartCardSkeleton />}>
            <TrendChart data={trend} title="Daily Survey & Approval Trend" />
          </Suspense>
        </FadeIn>
        <FadeIn delay={0.05}>
          <Suspense fallback={<ChartCardSkeleton />}>
            <SurveyorProductivityChart
              data={breakdown?.bySurveyor?.map((s) => ({
                name: s.name,
                approved: s.approved,
                submitted: s.submitted,
                drafts: s.drafts,
              }))}
              title="Surveyor Productivity"
            />
          </Suspense>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Suspense fallback={<ChartCardSkeleton />}>
            <QcSupervisorProductivityChart
              data={breakdown?.byQcSupervisor?.map((s) => ({
                name: s.name,
                approved: s.approved,
                rejected: s.rejected,
              }))}
              title="QC Supervisor Productivity"
            />
          </Suspense>
        </FadeIn>
      </div>
    </section>
  );
}
