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
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import { useHasCapability } from "@/hooks/use-capability";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
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
  pageNumber: number;
};

type SurveysListUiAction =
  | { type: "setFilters"; value: FilterState }
  | { type: "setPageSize"; value: number }
  | { type: "setActiveTab"; value: string }
  | { type: "setPageNumber"; value: number };

function surveysListUiReducer(state: SurveysListUiState, action: SurveysListUiAction): SurveysListUiState {
  switch (action.type) {
    case "setFilters":
      return { ...state, filters: action.value, pageNumber: 1 };
    case "setPageSize":
      return { ...state, pageSize: action.value, pageNumber: 1 };
    case "setActiveTab":
      return { ...state, activeTab: action.value, pageNumber: 1 };
    case "setPageNumber":
      return { ...state, pageNumber: action.value };
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
    pageNumber: 1,
  });
  const { filters, pageSize, activeTab, pageNumber } = listUi;

  const listFilters = useMemo(
    () => ({
      status: filters.status as SurveyStatus | undefined,
      qcStatus: filters.qcStatus as QcStatus | undefined,
      wardNo: filters.wardNo,
      districtId: filters.districtId,
      municipalityId: filters.municipalityId,
      surveyorId: canViewAll ? filters.surveyorId : undefined,
    }),
    [filters, canViewAll],
  );
  const surveys = useSurveyList({ ...listFilters, limit: 2000 });
  const isLoading = surveys === undefined;

  const filtered = useMemo(
    () => (surveys ? searchSurveys(surveys as any, filters.search, ulbCodes) : surveys),
    [surveys, filters.search, ulbCodes],
  );
  const fromDateMs = useMemo(
    () => (filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`).getTime() : undefined),
    [filters.fromDate],
  );
  const toDateMs = useMemo(
    () => (filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`).getTime() : undefined),
    [filters.toDate],
  );
  const filteredByDate = useMemo(
    () =>
      (filtered ?? []).filter((r: any) => {
        const createdAt = r._creationTime;
        if (fromDateMs !== undefined && createdAt < fromDateMs) return false;
        if (toDateMs !== undefined && createdAt > toDateMs) return false;
        return true;
      }),
    [filtered, fromDateMs, toDateMs],
  );
  const filteredByTab = useMemo(() => {
    const rows = (filteredByDate ?? []) as any[];
    if (activeTab === "qcPending") return rows.filter((r) => r.qcStatus === "pending");
    if (activeTab === "qcApproved") return rows.filter((r) => r.qcStatus === "approved");
    if (activeTab === "qcRejected") return rows.filter((r) => r.qcStatus === "rejected");
    if (activeTab === "draft") return rows.filter((r) => r.status === "draft");
    if (activeTab === "submitted") return rows.filter((r) => r.status === "submitted");
    return rows;
  }, [filteredByDate, activeTab]);

  const pageStart = (pageNumber - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredByTab.slice(pageStart, pageStart + pageSize),
    [filteredByTab, pageStart, pageSize],
  );
  const canGoPrev = pageNumber > 1;
  const canGoNext = pageStart + pageSize < filteredByTab.length;

  const stats = useMemo(() => {
    const rows = filteredByDate as any[];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const total = rows.length;
    const today = rows.filter((r) => r._creationTime >= todayStart.getTime()).length;
    const qcPending = rows.filter((r) => r.qcStatus === "pending").length;
    const approved = rows.filter((r) => r.qcStatus === "approved").length;
    const rejected = rows.filter((r) => r.qcStatus === "rejected").length;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : "0.0";
    return { total, today, qcPending, approved, rejected, rejectionRate };
  }, [filteredByDate]);

  const draftCount = (filteredByDate as any[]).filter((r) => r.status === "draft").length;
  const submittedCount = (filteredByDate as any[]).filter((r) => r.status === "submitted").length;

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
            hint="in active filters"
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
            showSurveyorFilter={canViewAll}
            surveyorOptions={surveyorOptions}
          />
        </GlassCard>

        <GlassCard padding="none" className="overflow-hidden">
          <div className="border-b border-border/60 px-5 py-4">
            <SectionHeader
              title="Survey Registry"
              description={`${filteredByTab.length.toLocaleString()} surveys${activeTab !== "all" ? " in selected tab" : ""}`}
            />
          </div>
          <div className="border-b border-border/60 bg-muted/20 px-4 py-2.5">
            <Tabs value={activeTab} onValueChange={(tab) => dispatchListUi({ type: "setActiveTab", value: tab })}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
                <TabPill
                  value="all"
                  label="All"
                  count={filteredByDate.length}
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
          itemCount={pagedRows.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => dispatchListUi({ type: "setPageNumber", value: Math.max(1, pageNumber - 1) })}
          onNext={() => dispatchListUi({ type: "setPageNumber", value: canGoNext ? pageNumber + 1 : pageNumber })}
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
