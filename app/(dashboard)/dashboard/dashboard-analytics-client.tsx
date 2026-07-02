"use client";

import { CoverageChart, MunicipalityPerformanceCard } from "@/components/analytics/charts";
import { OrganizationSection } from "@/components/dashboard/organization-section";
import { ProductivitySection } from "@/components/dashboard/productivity-section";
import { SectionHeader } from "@/components/design-system/executive-hero";
import { api } from "@/convex/_generated/api";
import { useDashboardHome } from "@/hooks/analytics/useAnalytics";
import type { Preloaded } from "convex/react";

export function DashboardAnalyticsClient({
  preloadedHome,
}: {
  preloadedHome: Preloaded<typeof api.webDashboard.homeBundle>;
}) {
  const home = useDashboardHome(preloadedHome);
  const analytics = home?.analytics;

  if (!analytics) return null;

  const { breakdown, dailyTrend, wardCoverage } = analytics;

  return (
    <>
      <OrganizationSection breakdown={breakdown} />
      <ProductivitySection breakdown={breakdown} trend={dailyTrend} />
      <section aria-labelledby="coverage-heading">
        <SectionHeader title="Coverage" description="Ward-level survey coverage" className="mb-4" />
        <div>
          <CoverageChart
            data={wardCoverage?.map((w) => ({
              wardNo: w.wardNo,
              municipalityName: w.municipalityName,
              total: w.total,
              approvalRate: w.approvalRate,
            }))}
            title="Ward Coverage Detail"
          />
        </div>
        <div className="mt-4">
          <MunicipalityPerformanceCard
            items={breakdown?.byUlb?.map((m) => ({
              id: m.municipalityId,
              name: m.name,
              approved: m.approved,
              total: m.total,
            }))}
          />
        </div>
      </section>
    </>
  );
}
