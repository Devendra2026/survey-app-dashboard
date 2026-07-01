"use client";

import { CoverageChart, MunicipalityPerformanceCard } from "@/components/analytics/charts";
import { KpiMetricsSection } from "@/components/dashboard/kpi-metrics-section";
import { OrganizationSection } from "@/components/dashboard/organization-section";
import { ProductivitySection } from "@/components/dashboard/productivity-section";
import { ActivityFeed } from "@/components/design-system/activity-feed";
import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { FadeIn } from "@/components/design-system/motion";
import { useRecentActivity, useWebDashboardBundle } from "@/hooks/analytics/useAnalytics";
import { buildActivityFeed } from "@/lib/activity-feed";
import { can } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import { AlertTriangle, ClipboardList, LayoutDashboard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const { user, role } = useCurrentUser();
  const { counts, analytics, analyticsUnavailable } = useWebDashboardBundle(30);
  const showAnalytics = analytics != null && analytics.breakdown != null;
  const breakdown = analytics?.breakdown;
  const trend = analytics?.dailyTrend;
  const coverage = analytics?.wardCoverage;

  const [activityEnabled, setActivityEnabled] = useState(false);
  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setActivityEnabled(true));
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setActivityEnabled(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const recentSurveys = useRecentActivity(activityEnabled);

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

      {analyticsUnavailable && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Analytics could not be loaded from the server. KPI counts are shown from a fallback query; charts and
            coverage are hidden until the backend is updated. Contact your administrator if this persists.
          </p>
        </div>
      )}

      <KpiMetricsSection counts={counts} />

      {showAnalytics && (
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
      )}

      <section aria-labelledby="activity-heading" className="border-t border-border/50 pt-6 lg:pt-8">
        <FadeIn delay={0.1}>
          <ActivityFeed items={activity} loading={recentSurveys === undefined} />
        </FadeIn>
      </section>
    </div>
  );
}
