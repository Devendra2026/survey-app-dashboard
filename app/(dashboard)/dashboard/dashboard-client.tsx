"use client";

import { CoverageChart, MunicipalityPerformanceCard } from "@/components/analytics/charts";
import { KpiMetricsSection } from "@/components/dashboard/kpi-metrics-section";
import { OrganizationSection } from "@/components/dashboard/organization-section";
import { ProductivitySection } from "@/components/dashboard/productivity-section";
import { ActivityFeed } from "@/components/design-system/activity-feed";
import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { FadeIn } from "@/components/design-system/motion";
import { CardsSkeleton } from "@/components/shared/loading";
import { api } from "@/convex/_generated/api";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { buildActivityFeed } from "@/lib/activity-feed";
import { can } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import { type Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { ClipboardList, LayoutDashboard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo } from "react";

function ChartsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading analytics">
      <CardsSkeleton count={2} />
      <CardsSkeleton count={2} />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading activity">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

function DashboardAnalytics({ nowMs }: { nowMs: number }) {
  const ready = useConvexAuthReady();
  const analytics = useQuery(api.webDashboard.analyticsBundle, ready ? { nowMs, trendDays: 30 } : "skip");

  if (analytics === undefined) return <ChartsSkeleton />;
  if (analytics === null) return null;

  const breakdown = analytics.breakdown;
  const trend = analytics.dailyTrend;
  const coverage = analytics.wardCoverage;

  return (
    <>
      <OrganizationSection breakdown={breakdown} />
      <ProductivitySection breakdown={breakdown} trend={trend} />
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

function DashboardActivity() {
  const ready = useConvexAuthReady();
  const recentSurveys = useQuery(api.webDashboard.recentActivity, ready ? {} : "skip");

  const activity = useMemo(
    () => (recentSurveys ? buildActivityFeed(recentSurveys as Parameters<typeof buildActivityFeed>[0]) : []),
    [recentSurveys],
  );

  return <ActivityFeed items={activity} loading={recentSurveys === undefined} />;
}

export function DashboardPageClient({
  preloadedCounts,
  nowMs,
}: {
  preloadedCounts: Preloaded<typeof api.webDashboard.counts>;
  nowMs: number;
}) {
  const { user, role } = useCurrentUser();
  const counts = usePreloadedQuery(preloadedCounts);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const municipality = user?.municipality?.name;

  const showAnalyticsShell = counts !== undefined;

  return (
    <div className="space-y-6 lg:space-y-8">
      <FadeIn>
        <ExecutiveHero
          eyebrow="Survey Dashboard"
          title={`Welcome back, ${firstName}`}
          description={
            municipality
              ? `Operations overview for ${municipality} — pipeline health, team capacity, and QC throughput.`
              : "Operations overview across your assigned scope — pipeline health, team capacity, and QC throughput."
          }
          icon={LayoutDashboard}
          gradient="brand"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/surveys"
                className="btn-brand inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition-colors duration-200"
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                Surveys
              </Link>
              {can(role, "qc.review") && (
                <Link
                  href="/qc"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors duration-200 hover:bg-muted/50"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  QC Queue
                </Link>
              )}
            </div>
          }
        />
      </FadeIn>

      <KpiMetricsSection counts={counts} />

      {showAnalyticsShell && (
        <Suspense fallback={<ChartsSkeleton />}>
          <DashboardAnalytics nowMs={nowMs} />
        </Suspense>
      )}

      <section aria-labelledby="activity-heading" className="border-t border-border/50 pt-6 lg:pt-8">
        <FadeIn delay={0.1}>
          <Suspense fallback={<ActivitySkeleton />}>
            <DashboardActivity />
          </Suspense>
        </FadeIn>
      </section>
    </div>
  );
}
