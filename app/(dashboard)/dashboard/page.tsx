"use client";

import {
  CoverageChart,
  MunicipalityPerformanceCard,
  SurveyorProductivityChart,
  TrendChart,
} from "@/components/analytics/charts";
import { KpiCard } from "@/components/shared/kpi-card";
import { CardsSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { useDailyTrend, useDashboardCounts, useStatsBreakdown, useWardCoverage } from "@/hooks/analytics/useAnalytics";
import { can } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import type { ReactNode } from "react";

function DashboardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground/90">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { user, role } = useCurrentUser();
  const counts = useDashboardCounts();
  const showAnalytics = can(role, "analytics.view");

  const breakdown = useStatsBreakdown();
  const trend = useDailyTrend(30);
  const coverage = useWardCoverage();

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          role === "surveyor" ? "Your survey activity at a glance." : "Executive overview across your assigned scope."
        }
      />

      <DashboardSection title="Survey pipeline" description="Counts for surveys in your scope">
        {counts === undefined ? (
          <CardsSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total Surveys" value={counts.total} />
            <KpiCard label="Drafts" value={counts.drafts} tone="muted" />
            <KpiCard label="Submitted" value={counts.submitted} tone="default" />
            <KpiCard label="Pending QC" value={counts.submitted} tone="warning" hint="Awaiting review" />
            <KpiCard label="Approved" value={counts.approved} tone="success" />
            <KpiCard label="Rejected" value={counts.rejected} tone="destructive" />
          </div>
        )}
      </DashboardSection>

      {showAnalytics && breakdown && (
        <DashboardSection title="Organization" description="Coverage across teams and geography">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KpiCard label="Surveyors" value={breakdown.filterOptions.surveyors.length} />
            <KpiCard label="Municipalities" value={breakdown.byUlb.length} />
            <KpiCard label="Districts" value={breakdown.filterOptions.districts.length} />
            <KpiCard label="Today" value={counts?.today ?? 0} tone="default" hint="Surveys created today" />
          </div>
        </DashboardSection>
      )}

      {showAnalytics && (
        <DashboardSection title="Analytics" description="Trends and performance over the last 30 days">
          <div className="grid gap-4 lg:grid-cols-2">
            <TrendChart data={trend ?? undefined} title="Daily Survey & Approval Trend" />
            <SurveyorProductivityChart
              data={breakdown?.bySurveyor.map((s) => ({
                name: s.name,
                approved: s.approved,
                submitted: s.submitted,
                drafts: s.drafts,
              }))}
              title="Surveyor Productivity"
            />
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <CoverageChart
              data={coverage?.map((w) => ({
                wardNo: w.wardNo,
                municipalityName: w.municipalityName,
                total: w.total,
                approvalRate: w.approvalRate,
              }))}
              title="Ward Coverage"
            />
            <MunicipalityPerformanceCard
              items={breakdown?.byUlb.map((m) => ({
                id: m.municipalityId,
                name: m.name,
                approved: m.approved,
                total: m.total,
              }))}
            />
          </div>
        </DashboardSection>
      )}
    </div>
  );
}
