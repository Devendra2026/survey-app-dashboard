"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { PageTransition } from "@/components/design-system/motion";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { SurveyExcelActions } from "@/components/surveys/survey-excel-actions";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { BarChart3, CalendarDays, CheckCircle2, Clock3, Filter, LayoutList, Plus, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [filters, setFilters] = useState<FilterState>({ search: "" });
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);

  const handleFiltersChange = (next: FilterState) => {
    setFilters(next);
    setPageNumber(1);
  };
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPageNumber(1);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageNumber(1);
  };

  const listFilters = useMemo(
    () => ({
      status: filters.status as SurveyStatus | undefined,
      qcStatus: filters.qcStatus as QcStatus | undefined,
      wardNo: filters.wardNo,
      districtId: filters.districtId,
      municipalityId: filters.municipalityId,
    }),
    [filters],
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

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
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
        <SurveyFilters value={filters} onChange={handleFiltersChange} />
      </GlassCard>

      <GlassCard padding="none" className="overflow-hidden">
        <div className="border-b border-border/60 px-5 py-4">
          <SectionHeader
            title="Survey Registry"
            description={`${filteredByTab.length.toLocaleString()} surveys${activeTab !== "all" ? " in selected tab" : ""}`}
          />
        </div>
        <div className="border-b border-border/60 bg-muted/20 px-4 py-2.5">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
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
          <SurveyTable rows={isLoading ? undefined : (pagedRows as Parameters<typeof SurveyTable>[0]["rows"])} />
        </div>
      </GlassCard>

      <TablePagination
        pageNumber={pageNumber}
        pageSize={pageSize}
        itemCount={pagedRows.length}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={() => setPageNumber((p) => Math.max(1, p - 1))}
        onNext={() => setPageNumber((p) => (canGoNext ? p + 1 : p))}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={handlePageSizeChange}
      />
    </PageTransition>
  );
}
