"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { RoleGate } from "@/components/shared/role-gate";
import { SurveyExcelActions } from "@/components/surveys/survey-excel-actions";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SurveysPageStats } from "@/hooks/surveys/useSurveysPage";
import {
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileEdit,
  Filter,
  LayoutList,
  Plus,
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

export function SurveysPageHero({
  canReassign,
  listFilters,
  isLoading,
  onReassignOpen,
}: {
  canReassign: boolean;
  listFilters: Parameters<typeof SurveyExcelActions>[0]["filters"];
  isLoading: boolean;
  onReassignOpen: () => void;
}) {
  return (
    <ExecutiveHero
      eyebrow="Survey Dashboard"
      title="Survey Management"
      description="Search, filter, and manage property surveys across your assigned scope."
      icon={LayoutList}
      gradient="brand"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <RoleGate
            capability="reports.export"
            fallback={<SurveyExcelActions filters={listFilters} disabled={isLoading} />}
          >
            <SurveyExcelActions filters={listFilters} canImport disabled={isLoading} />
          </RoleGate>
          {canReassign && (
            <Button type="button" variant="outline" className="cursor-pointer rounded-xl" onClick={onReassignOpen}>
              <ArrowRightLeft className="h-4 w-4" aria-hidden /> Reassign drafts
            </Button>
          )}
          <RoleGate capability="surveys.editDraft" fallback={null}>
            <Button asChild className="btn-brand cursor-pointer rounded-xl shadow-md">
              <Link href="/surveys/new">
                <Plus className="h-4 w-4" aria-hidden /> New Survey
              </Link>
            </Button>
          </RoleGate>
        </div>
      }
    />
  );
}

export function SurveysMetricsSection({
  stats,
  draftCount,
  metricsReady,
  showAnalytics,
}: {
  stats: SurveysPageStats;
  draftCount: number;
  metricsReady: boolean;
  showAnalytics: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-6">
      <MetricCard
        label="Field Drafts"
        value={draftCount.toLocaleString()}
        hint="in progress on mobile/web"
        icon={FileEdit}
        tone="default"
      />
      <MetricCard
        label="Total Surveys"
        value={stats.total.toLocaleString()}
        hint={metricsReady ? (showAnalytics ? "in filter scope" : "in your scope") : "loading…"}
        icon={BarChart3}
        tone="default"
      />
      <MetricCard
        label="QC Pending"
        value={stats.qcPending.toLocaleString()}
        hint="awaiting review"
        icon={Clock3}
        tone="warning"
      />
      <MetricCard
        label="Approved"
        value={stats.approved.toLocaleString()}
        hint="QC approved"
        icon={CheckCircle2}
        tone="success"
      />
      <MetricCard
        label="Today"
        value={stats.today.toLocaleString()}
        hint={
          stats.submittedToday !== undefined
            ? `${stats.submittedToday.toLocaleString()} submitted today`
            : "created today"
        }
        icon={CalendarDays}
        tone="info"
      />
      <MetricCard
        label="Rejection Rate"
        value={`${stats.rejectionRate}%`}
        hint={`${stats.rejected} rejected`}
        icon={TrendingDown}
        tone="destructive"
      />
    </div>
  );
}

export function SurveysFiltersSection({
  filters,
  onFiltersChange,
  surveyorOptions,
}: {
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  surveyorOptions?: { _id: string; name: string; role: string }[];
}) {
  return (
    <GlassCard padding="md">
      <SectionHeader
        title="Smart Filters"
        description="Narrow by geography, status, and date range"
        action={<Filter className="h-4 w-4 text-primary" aria-hidden />}
        className="mb-4"
      />
      <SurveyFilters value={filters} onChange={onFiltersChange} surveyorOptions={surveyorOptions} />
    </GlassCard>
  );
}

export function SurveysRegistrySection({
  activeTab,
  onActiveTabChange,
  stats,
  draftCount,
  submittedCount,
  pageNumber,
  canGoNext,
  isLoading,
  pagedRows,
  showSurveyor,
}: {
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  stats: SurveysPageStats;
  draftCount: number;
  submittedCount: number;
  pageNumber: number;
  canGoNext: boolean;
  isLoading: boolean;
  pagedRows: Parameters<typeof SurveyTable>[0]["rows"];
  showSurveyor: boolean;
}) {
  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div className="border-b border-border/60 px-5 py-4">
        <SectionHeader
          title="Survey Registry"
          description={`Page ${pageNumber}${canGoNext ? "+" : ""} · server-paginated list`}
        />
      </div>
      <div className="border-b border-border/60 bg-muted/20 px-4 py-2.5">
        <Tabs value={activeTab} onValueChange={onActiveTabChange}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
            <TabPill
              value="all"
              label="All"
              count={stats.total}
              activeColor="data-[state=active]:bg-brand-navy data-[state=active]:text-white dark:data-[state=active]:bg-primary"
            />
            <TabPill
              value="qcPending"
              label="QC Pending"
              count={stats.qcPending}
              activeColor="data-[state=active]:bg-warning data-[state=active]:text-amber-950"
            />
            <TabPill
              value="qcApproved"
              label="Approved"
              count={stats.approved}
              activeColor="data-[state=active]:bg-success data-[state=active]:text-white"
            />
            <TabPill
              value="qcRejected"
              label="Rejected"
              count={stats.rejected}
              activeColor="data-[state=active]:bg-brand-red data-[state=active]:text-white"
            />
            <TabPill
              value="draft"
              label="Draft"
              count={draftCount}
              activeColor="data-[state=active]:bg-muted-foreground/80 data-[state=active]:text-white"
            />
            <TabPill
              value="submitted"
              label="Submitted"
              count={submittedCount}
              activeColor="data-[state=active]:bg-brand-navy data-[state=active]:text-white dark:data-[state=active]:bg-primary"
            />
          </TabsList>
        </Tabs>
      </div>
      <div className="p-4">
        <SurveyTable rows={isLoading ? undefined : pagedRows} showSurveyor={showSurveyor} />
      </div>
    </GlassCard>
  );
}
