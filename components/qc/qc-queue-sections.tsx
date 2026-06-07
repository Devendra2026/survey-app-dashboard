"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { QcPipeline } from "@/components/design-system/qc-pipeline";
import { CardsSkeleton } from "@/components/shared/loading";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable, type SurveyRow } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QcQueueStats } from "@/hooks/qc/useQcQueue";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileBarChart,
  Filter,
  PlayCircle,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

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

export function QcQueueHero({ nextPendingId }: { nextPendingId?: string }) {
  return (
    <FadeIn>
      <ExecutiveHero
        eyebrow="Quality Control"
        title="QC Command Center"
        description="Review submitted surveys, approve compliant records, or return corrections with a full audit trail."
        icon={ShieldCheck}
        gradient="brand"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {nextPendingId && (
              <Button asChild className="btn-brand cursor-pointer rounded-xl shadow-md">
                <Link href={`/qc/${nextPendingId}`}>
                  <PlayCircle className="h-4 w-4" aria-hidden />
                  Review Next
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="cursor-pointer rounded-xl border-border/60 bg-background/80 backdrop-blur-sm transition-all duration-200 hover:bg-muted/50"
            >
              <Link href="/reports">
                <FileBarChart className="h-4 w-4" aria-hidden />
                Reports
              </Link>
            </Button>
          </div>
        }
      />
    </FadeIn>
  );
}

export function QcPendingAlert({ stats, nextPendingId }: { stats: QcQueueStats; nextPendingId?: string }) {
  if (stats.pending <= 0) return null;

  return (
    <FadeIn delay={0.04}>
      <output className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {stats.pending.toLocaleString()} survey{stats.pending === 1 ? "" : "s"} awaiting QC decision
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.submittedToday > 0 ? `${stats.submittedToday} submitted today · ` : ""}
              Start with the oldest pending record to keep turnaround low.
            </p>
          </div>
        </div>
        {nextPendingId && (
          <Button
            asChild
            size="sm"
            className="shrink-0 cursor-pointer rounded-xl bg-warning text-amber-950 hover:bg-warning/90"
          >
            <Link href={`/qc/${nextPendingId}`}>
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              Open oldest pending
            </Link>
          </Button>
        )}
      </output>
    </FadeIn>
  );
}

export function QcMetricsSection({ stats, isLoading }: { stats: QcQueueStats; isLoading: boolean }) {
  return (
    <section aria-labelledby="qc-kpi-heading">
      <SectionHeader
        id="qc-kpi-heading"
        title="QC Metrics"
        description="Pipeline health for your current filter scope"
        className="mb-4"
      />
      {isLoading ? (
        <CardsSkeleton count={5} />
      ) : (
        <StaggerGrid className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
          <StaggerItem>
            <MetricCard
              label="Pending Review"
              value={stats.pending.toLocaleString()}
              hint="awaiting QC decision"
              icon={Clock3}
              tone="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Approved"
              value={stats.approved.toLocaleString()}
              hint="QC passed"
              icon={CheckCircle2}
              tone="success"
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Returned"
              value={stats.rejected.toLocaleString()}
              hint="sent back to surveyor"
              icon={TrendingDown}
              tone="destructive"
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
          <StaggerItem>
            <MetricCard
              label="Approval Rate"
              value={`${stats.approvalRate}%`}
              hint={`${stats.approved} of ${stats.approved + stats.rejected} decided`}
              icon={BarChart3}
              tone="ai"
            />
          </StaggerItem>
        </StaggerGrid>
      )}
    </section>
  );
}

export function QcPipelineSection({
  stats,
  pipelineStage,
  onStageClick,
}: {
  stats: QcQueueStats;
  pipelineStage?: string;
  onStageClick: (tab: string) => void;
}) {
  return (
    <FadeIn delay={0.06}>
      <section aria-labelledby="qc-pipeline-heading">
        <QcPipeline
          pending={stats.pending}
          approved={stats.approved}
          rejected={stats.rejected}
          activeStage={pipelineStage}
          onStageClick={onStageClick}
          className="scroll-mt-24"
        />
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
    <FadeIn delay={0.08}>
      <GlassCard padding="md">
        <SectionHeader
          title="Smart Filters"
          description="Narrow by geography, ward, and submission date"
          action={<Filter className="h-4 w-4 text-brand-navy dark:text-primary" aria-hidden />}
          className="mb-4"
        />
        <SurveyFilters value={filters} onChange={onChange} showStatus={false} showQcStatus={false} />
      </GlassCard>
    </FadeIn>
  );
}

export function QcReviewRegistry({
  stats,
  activeTab,
  filteredCount,
  isLoading,
  rows,
  onTabChange,
}: {
  stats: QcQueueStats;
  activeTab: string;
  filteredCount: number;
  isLoading: boolean;
  rows: SurveyRow[] | undefined;
  onTabChange: (tab: string) => void;
}) {
  return (
    <FadeIn delay={0.1}>
      <GlassCard padding="none" className="overflow-hidden">
        <div className="border-b border-border/60 px-5 py-4">
          <SectionHeader
            title="QC Review Registry"
            description={`${filteredCount.toLocaleString()} records${activeTab !== "all" ? " in selected tab" : ""}`}
          />
        </div>
        <div className="border-b border-border/60 bg-muted/20 px-4 py-2.5">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
              <TabPill
                value="pending"
                label="Pending"
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
                count={stats.rejected}
                activeColor="data-[state=active]:bg-brand-red data-[state=active]:text-white"
              />
              <TabPill
                value="all"
                label="All Decided"
                count={stats.totalInQueue}
                activeColor="data-[state=active]:bg-brand-navy data-[state=active]:text-white dark:data-[state=active]:bg-primary"
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
