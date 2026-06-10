"use client";

import { CoverageChart, MunicipalityPerformanceCard } from "@/components/analytics/charts";
import { ActivityFeed, buildActivityFeed } from "@/components/design-system/activity-feed";
import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { MetricCard } from "@/components/design-system/metric-card";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { CardsSkeleton } from "@/components/shared/loading";
import { useDailyTrend, useDashboardCounts, useStatsBreakdown, useWardCoverage } from "@/hooks/analytics/useAnalytics";
import { useSurveyList } from "@/hooks/surveys/useSurveys";
import { useHasCapability } from "@/hooks/use-capability";
import { can } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";

const TrendChart = dynamic(() => import("@/components/analytics/recharts-charts").then((mod) => mod.TrendChart), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-muted/50" aria-hidden />,
});

const SurveyorProductivityChart = dynamic(
  () => import("@/components/analytics/recharts-charts").then((mod) => mod.SurveyorProductivityChart),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-muted/50" aria-hidden /> },
);

export default function DashboardPage() {
  const { user, role } = useCurrentUser();
  const counts = useDashboardCounts();
  const showAnalytics = useHasCapability("analytics.view");
  const breakdown = useStatsBreakdown();
  const trend = useDailyTrend(30);
  const coverage = useWardCoverage();
  const recentSurveys = useSurveyList({ limit: 50 });

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const municipality = user?.municipality?.name;

  const activity = useMemo(
    () => (recentSurveys ? buildActivityFeed(recentSurveys as Parameters<typeof buildActivityFeed>[0]) : []),
    [recentSurveys],
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      <FadeIn>
        <ExecutiveHero
          eyebrow="Survey Dashboard"
          title={`Welcome back, ${firstName}`}
          description={
            municipality
              ? `Survey operations overview for ${municipality}. Monitor pipeline health and QC performance.`
              : "Survey operations overview across your assigned scope."
          }
          icon={LayoutDashboard}
          gradient="brand"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/surveys"
                className="btn-brand inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200"
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                Surveys
              </Link>
              {can(role, "qc.review") && (
                <Link
                  href="/qc"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-muted/50"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  QC Queue
                </Link>
              )}
            </div>
          }
        />
      </FadeIn>

      <section aria-labelledby="kpi-heading">
        <SectionHeader title="KPI Metrics" description="Most important survey pipeline indicators" className="mb-4" />
        {counts === undefined ? (
          <CardsSkeleton count={6} />
        ) : (
          <StaggerGrid className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StaggerItem>
              <MetricCard
                label="Pending QC"
                value={counts.submitted}
                icon={Clock3}
                tone="warning"
                hint="Awaiting review"
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard label="Approved" value={counts.approved} icon={CheckCircle2} tone="success" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard label="Total Surveys" value={counts.total} icon={ClipboardList} tone="default" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard label="Today" value={counts.today} hint="Created today" icon={CalendarDays} tone="info" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard label="Rejected" value={counts.rejected} icon={XCircle} tone="destructive" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard label="Drafts" value={counts.drafts} icon={Activity} tone="muted" />
            </StaggerItem>
          </StaggerGrid>
        )}
      </section>

      {showAnalytics && (
        <>
          <section aria-labelledby="org-heading">
            <SectionHeader title="Organization" description="Teams and geographic scope" className="mb-4" />
            {breakdown && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <MetricCard label="Surveyors" value={breakdown.filterOptions.surveyors.length} icon={Activity} />
                <MetricCard label="Municipalities" value={breakdown.byUlb.length} icon={MapPin} tone="info" />
                <MetricCard label="Districts" value={breakdown.filterOptions.districts.length} icon={MapPin} />
              </div>
            )}
          </section>

          <section aria-labelledby="analytics-heading">
            <SectionHeader
              title="Productivity Analytics"
              description="30-day trends and performance"
              className="mb-4"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <FadeIn>
                <TrendChart data={trend ?? undefined} title="Daily Survey & Approval Trend" />
              </FadeIn>
              <FadeIn delay={0.05}>
                <SurveyorProductivityChart
                  data={breakdown?.bySurveyor.map((s) => ({
                    name: s.name,
                    approved: s.approved,
                    submitted: s.submitted,
                    drafts: s.drafts,
                  }))}
                  title="Surveyor Productivity"
                />
              </FadeIn>
            </div>
          </section>

          <section aria-labelledby="coverage-heading">
            <SectionHeader title="Coverage" description="Ward-level survey coverage" className="mb-4" />
            <div>
              <CoverageChart
                data={coverage?.map((w) => ({
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
                items={breakdown?.byUlb.map((m) => ({
                  id: m.municipalityId,
                  name: m.name,
                  approved: m.approved,
                  total: m.total,
                }))}
              />
            </div>
          </section>
        </>
      )}

      <section aria-labelledby="activity-heading" className="border-t border-border/50 pt-6 lg:pt-8">
        <FadeIn delay={0.1}>
          <ActivityFeed items={activity} loading={recentSurveys === undefined} />
        </FadeIn>
      </section>
    </div>
  );
}
