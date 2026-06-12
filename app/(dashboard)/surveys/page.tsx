"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { PageTransition } from "@/components/design-system/motion";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { SurveyExcelActions } from "@/components/surveys/survey-excel-actions";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyReassignDialog } from "@/components/surveys/survey-reassign-dialog";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useDashboardCounts, useStatsBreakdown } from "@/hooks/analytics/useAnalytics";
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyListPaginated } from "@/hooks/surveys/useSurveys";
import { useHasCapability } from "@/hooks/use-capability";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { estimateQcPendingCount, surveyTabToListFilters } from "@/lib/surveys/survey-list-filters";
import { useQuery } from "convex/react";
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
import { useMemo, useReducer, useState } from "react";

type SurveysListUiState = {
  filters: FilterState;
  pageSize: number;
  activeTab: string;
};

type SurveysListUiAction =
  | { type: "setFilters"; value: FilterState }
  | { type: "setPageSize"; value: number }
  | { type: "setActiveTab"; value: string };

function surveysListUiReducer(state: SurveysListUiState, action: SurveysListUiAction): SurveysListUiState {
  switch (action.type) {
    case "setFilters":
      return { ...state, filters: action.value };
    case "setPageSize":
      return { ...state, pageSize: action.value };
    case "setActiveTab":
      return { ...state, activeTab: action.value };
    default:
      return state;
  }
}

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

export default function SurveysPage() {
  const canViewAll = useHasCapability("surveys.viewAll");
  const canReassign = useHasCapability("surveys.reassign");
  const authReady = useConvexAuthReady();
  const { page: fieldUserPage } =
    useQuery(
      api.admin.listUsers,
      authReady && canViewAll ? { paginationOpts: { numItems: 200, cursor: null }, status: "active" } : "skip",
    ) ?? {};
  const surveyorOptions = useMemo(
    () =>
      (fieldUserPage ?? []).flatMap((u) =>
        u.role === "surveyor" || u.role === "supervisor" ? [{ _id: u._id, name: u.name, role: u.role }] : [],
      ),
    [fieldUserPage],
  );
  const [reassignOpen, setReassignOpen] = useState(false);
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [listUi, dispatchListUi] = useReducer(surveysListUiReducer, {
    filters: { search: "" },
    pageSize: 20,
    activeTab: "all",
  });
  const { filters, pageSize, activeTab } = listUi;

  const listFilters = useMemo(
    () => ({
      status: filters.status as SurveyStatus | undefined,
      qcStatus: filters.qcStatus as QcStatus | undefined,
      wardNo: filters.wardNo,
      districtId: filters.districtId,
      municipalityId: filters.municipalityId,
      surveyorId: canViewAll ? filters.surveyorId : undefined,
      ...surveyTabToListFilters(activeTab),
    }),
    [filters, canViewAll, activeTab],
  );

  const { surveys, isLoading, pageNumber, canGoPrev, canGoNext, goNext, goPrev } = useSurveyListPaginated(
    listFilters,
    pageSize,
  );

  const showAnalytics = useHasCapability("analytics.view");
  const breakdown = useStatsBreakdown({
    districtId: filters.districtId,
    municipalityId: filters.municipalityId,
    surveyorId: canViewAll ? filters.surveyorId : undefined,
  });
  const dashCounts = useDashboardCounts();

  const fromDateMs = useMemo(
    () => (filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`).getTime() : undefined),
    [filters.fromDate],
  );
  const toDateMs = useMemo(
    () => (filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`).getTime() : undefined),
    [filters.toDate],
  );

  const pagedRows = useMemo(() => {
    if (!surveys) return surveys;
    let rows = searchSurveys(surveys as Parameters<typeof searchSurveys>[0], filters.search, ulbCodes);
    if (fromDateMs !== undefined || toDateMs !== undefined) {
      rows = rows.filter((r) => {
        const createdAt = (r as { _creationTime: number })._creationTime;
        if (fromDateMs !== undefined && createdAt < fromDateMs) return false;
        if (toDateMs !== undefined && createdAt > toDateMs) return false;
        return true;
      });
    }
    return rows;
  }, [surveys, filters.search, ulbCodes, fromDateMs, toDateMs]);

  const summary = showAnalytics ? breakdown?.summary : dashCounts;
  const stats = useMemo(
    () => ({
      total: summary?.total ?? 0,
      today: summary?.today ?? 0,
      qcPending: summary ? estimateQcPendingCount(summary) : 0,
      approved: summary?.approved ?? 0,
      rejected: summary?.rejected ?? 0,
      rejectionRate: summary && summary.total > 0 ? ((summary.rejected / summary.total) * 100).toFixed(1) : "0.0",
    }),
    [summary],
  );

  const draftCount = summary?.drafts ?? 0;
  const submittedCount = summary?.submitted ?? 0;
  const metricsReady = showAnalytics ? breakdown !== undefined : dashCounts !== undefined;

  return (
    <RoleGate
      mode="page"
      anyOf={["surveys.viewOwn", "surveys.viewAssigned", "surveys.viewAll"]}
      deniedDescription="The Surveys module is for field surveyors and supervisors. QC staff should use the QC Portal."
      redirectTo="/qc"
    >
      <PageTransition className="space-y-6 lg:space-y-8">
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
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer rounded-xl"
                  onClick={() => setReassignOpen(true)}
                >
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
            hint="surveys today"
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

        <GlassCard padding="md">
          <SectionHeader
            title="Smart Filters"
            description="Narrow by geography, status, and date range"
            action={<Filter className="h-4 w-4 text-primary" aria-hidden />}
            className="mb-4"
          />
          <SurveyFilters
            value={filters}
            onChange={(next) => dispatchListUi({ type: "setFilters", value: next })}
            surveyorOptions={canViewAll ? surveyorOptions : undefined}
          />
        </GlassCard>

        <GlassCard padding="none" className="overflow-hidden">
          <div className="border-b border-border/60 px-5 py-4">
            <SectionHeader
              title="Survey Registry"
              description={`Page ${pageNumber}${canGoNext ? "+" : ""} · server-paginated list`}
            />
          </div>
          <div className="border-b border-border/60 bg-muted/20 px-4 py-2.5">
            <Tabs value={activeTab} onValueChange={(tab) => dispatchListUi({ type: "setActiveTab", value: tab })}>
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
            <SurveyTable
              rows={isLoading ? undefined : (pagedRows as Parameters<typeof SurveyTable>[0]["rows"])}
              showSurveyor={canViewAll}
            />
          </div>
        </GlassCard>

        <TablePagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          itemCount={pagedRows?.length ?? 0}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={goPrev}
          onNext={goNext}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={(size) => dispatchListUi({ type: "setPageSize", value: size })}
        />
        <SurveyReassignDialog
          open={reassignOpen}
          onOpenChange={setReassignOpen}
          scope={{
            districtId: filters.districtId,
            municipalityId: filters.municipalityId,
            wardNo: filters.wardNo,
          }}
        />
      </PageTransition>
    </RoleGate>
  );
}
