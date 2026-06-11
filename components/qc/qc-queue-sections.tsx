"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { QcWardCards } from "@/components/qc/qc-ward-cards";
import { CardsSkeleton } from "@/components/shared/loading";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable, type SurveyRow } from "@/components/surveys/survey-tables";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QcQueueStats } from "@/hooks/qc/useQcQueue";
import type { QcWardRow } from "@/lib/qc/ward-stats";
import { CalendarDays, CheckCircle2, Clock3, Filter, ShieldCheck, Table2 } from "lucide-react";

function TabPill({
  value,
  label,
  count,
  activeColor,
}: {
  value: string;
  label: string;
  count: number;
  activeColor: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground ${activeColor}`}
    >
      {label}
      <span className="min-w-5 rounded-full bg-black/10 px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums dark:bg-white/10">
        {count}
      </span>
    </TabsTrigger>
  );
}

export function QcCommandHero() {
  return (
    <FadeIn>
      <ExecutiveHero
        eyebrow="Quality Control"
        title="QC Command Center"
        description="Use smart filters to scope metrics and ward-wise QC cards across your assigned ULBs."
        icon={ShieldCheck}
        gradient="amber"
      />
    </FadeIn>
  );
}

export function QcRegistryHero() {
  return (
    <FadeIn>
      <ExecutiveHero
        eyebrow="Quality Control"
        title="QC Review Registry"
        description="Filter, search, and open submitted surveys for verification, correction, and approval."
        icon={Table2}
        gradient="amber"
      />
    </FadeIn>
  );
}

export function QcMetricsSection({ stats, isLoading }: { stats: QcQueueStats; isLoading: boolean }) {
  return (
    <section aria-labelledby="qc-kpi-heading">
      <SectionHeader
        id="qc-kpi-heading"
        title="QC Metrics"
        description="Live counts for your current geographic filter scope"
        className="mb-4"
      />
      {isLoading ? (
        <CardsSkeleton count={3} />
      ) : (
        <StaggerGrid className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <StaggerItem>
            <MetricCard
              label="Pending QC"
              value={stats.pending.toLocaleString()}
              hint="awaiting verification"
              icon={Clock3}
              tone="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Approved QC"
              value={stats.approved.toLocaleString()}
              hint="QC passed"
              icon={CheckCircle2}
              tone="success"
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Submitted Today"
              value={stats.submittedToday.toLocaleString()}
              hint="new intake today"
              icon={CalendarDays}
              tone="info"
            />
          </StaggerItem>
        </StaggerGrid>
      )}
    </section>
  );
}

export function QcWardSection({ wardStats, isLoading }: { wardStats: QcWardRow[]; isLoading: boolean }) {
  return (
    <FadeIn delay={0.06}>
      <section aria-labelledby="qc-ward-heading">
        <SectionHeader
          id="qc-ward-heading"
          title="Ward Wise QC Data"
          description="QC pending, approved, and total properties per ward — open registry, report, or demand notice"
          className="mb-4"
        />
        <QcWardCards rows={isLoading ? undefined : wardStats} isLoading={isLoading} />
      </section>
    </FadeIn>
  );
}

export function QcFiltersSection({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <FadeIn delay={0.04}>
      <GlassCard padding="md" className="border-amber-500/15">
        <SectionHeader
          title="Smart Filters"
          description="District, ULB, ward, date range, and property search"
          action={<Filter className="h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden />}
          className="mb-4"
        />
        <SurveyFilters value={filters} onChange={onChange} showStatus={false} showQcStatus={false} />
      </GlassCard>
    </FadeIn>
  );
}

export function QcReviewRegistry({
  stats,
  rejectedCount,
  activeTab,
  filteredCount,
  isLoading,
  rows,
  onTabChange,
}: {
  stats: QcQueueStats;
  rejectedCount: number;
  activeTab: string;
  filteredCount: number;
  isLoading: boolean;
  rows: SurveyRow[] | undefined;
  onTabChange: (tab: string) => void;
}) {
  const totalDecided = stats.pending + stats.approved + rejectedCount;

  return (
    <FadeIn delay={0.08}>
      <GlassCard padding="none" className="overflow-hidden border-amber-500/15">
        <div className="border-b border-amber-500/20 bg-linear-to-r from-amber-500/10 via-card to-transparent px-5 py-4 dark:from-amber-500/15">
          <SectionHeader
            title="QC Review Registry"
            description={`${filteredCount.toLocaleString()} records${activeTab !== "all" ? " in selected tab" : ""} · click Review to verify`}
          />
        </div>
        <div className="border-b border-border/60 bg-muted/15 px-4 py-2.5">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
              <TabPill
                value="pending"
                label="Pending QC"
                count={stats.pending}
                activeColor="data-[state=active]:bg-warning data-[state=active]:text-amber-950"
              />
              <TabPill
                value="approved"
                label="Approved"
                count={stats.approved}
                activeColor="data-[state=active]:bg-success data-[state=active]:text-white"
              />
              <TabPill
                value="rejected"
                label="Returned"
                count={rejectedCount}
                activeColor="data-[state=active]:bg-brand-red data-[state=active]:text-white"
              />
              <TabPill
                value="all"
                label="All"
                count={totalDecided}
                activeColor="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              />
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto p-4">
          <SurveyTable rows={isLoading ? undefined : rows} hrefBase="/qc" variant="qc" />
        </div>
      </GlassCard>
    </FadeIn>
  );
}
