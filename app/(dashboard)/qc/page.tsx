"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { PageTransition } from "@/components/design-system/motion";
import { QcPipeline } from "@/components/design-system/qc-pipeline";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { BarChart3, CheckCircle2, ClipboardCheck, Clock3, Filter, TrendingDown } from "lucide-react";
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

export default function QcQueuePage() {
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [filters, setFilters] = useState<FilterState>({ search: "" });
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState("pending");
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
      wardNo: filters.wardNo,
      districtId: filters.districtId,
      municipalityId: filters.municipalityId,
      limit: 2000,
    }),
    [filters.wardNo, filters.districtId, filters.municipalityId],
  );

  const surveys = useSurveyList(listFilters);
  const isLoading = surveys === undefined;

  const filtered = useMemo(
    () => (surveys ? searchSurveys(surveys, filters.search, ulbCodes) : surveys),
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
      (filtered ?? []).filter((r) => {
        const ts = r.submittedAt ?? r._creationTime;
        if (fromDateMs !== undefined && ts < fromDateMs) return false;
        if (toDateMs !== undefined && ts > toDateMs) return false;
        return true;
      }),
    [filtered, fromDateMs, toDateMs],
  );

  const filteredByTab = useMemo(() => {
    const rows = filteredByDate ?? [];
    if (activeTab === "pending") return rows.filter((r) => r.qcStatus === "pending" && r.status === "submitted");
    if (activeTab === "approved") return rows.filter((r) => r.qcStatus === "approved");
    if (activeTab === "rejected") return rows.filter((r) => r.qcStatus === "rejected");
    return rows.filter((r) => r.status !== "draft" || r.qcStatus !== "pending");
  }, [filteredByDate, activeTab]);

  const pageStart = (pageNumber - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredByTab.slice(pageStart, pageStart + pageSize),
    [filteredByTab, pageStart, pageSize],
  );
  const canGoPrev = pageNumber > 1;
  const canGoNext = pageStart + pageSize < filteredByTab.length;

  const stats = useMemo(() => {
    const rows = filteredByDate;
    const pending = rows.filter((r) => r.qcStatus === "pending" && r.status === "submitted").length;
    const approved = rows.filter((r) => r.qcStatus === "approved").length;
    const rejected = rows.filter((r) => r.qcStatus === "rejected").length;
    const totalInQueue = pending + approved + rejected;
    const approvalRate = approved + rejected > 0 ? ((approved / (approved + rejected)) * 100).toFixed(1) : "0.0";
    return { pending, approved, rejected, totalInQueue, approvalRate };
  }, [filteredByDate]);

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control is available to supervisors and administrators."
    >
      <PageTransition className="space-y-6">
        <ExecutiveHero
          eyebrow="QC Intelligence"
          title="Quality Control"
          description="Review submitted surveys through the workflow pipeline. Approve, return, or escalate with full audit trail."
          icon={ClipboardCheck}
          gradient="amber"
        />

        <QcPipeline pending={stats.pending} approved={stats.approved} rejected={stats.rejected} />

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
          <MetricCard
            label="Pending Review"
            value={stats.pending.toLocaleString()}
            hint="awaiting QC decision"
            icon={Clock3}
            tone="warning"
          />
          <MetricCard
            label="Approved"
            value={stats.approved.toLocaleString()}
            hint="QC passed"
            icon={CheckCircle2}
            tone="success"
          />
          <MetricCard
            label="Returned"
            value={stats.rejected.toLocaleString()}
            hint="sent back to surveyor"
            icon={TrendingDown}
            tone="destructive"
          />
          <MetricCard
            label="In Scope"
            value={stats.totalInQueue.toLocaleString()}
            hint="in active filters"
            icon={BarChart3}
            tone="info"
          />
          <MetricCard
            label="Approval Rate"
            value={`${stats.approvalRate}%`}
            hint={`${stats.approved} of ${stats.approved + stats.rejected} decided`}
            icon={ClipboardCheck}
            tone="ai"
          />
        </div>

        <GlassCard padding="md">
          <SectionHeader
            title="Smart Filters"
            description="Geography and date range"
            action={<Filter className="h-4 w-4 text-primary" aria-hidden />}
            className="mb-4"
          />
          <SurveyFilters value={filters} onChange={handleFiltersChange} showStatus={false} showQcStatus={false} />
        </GlassCard>

        <GlassCard padding="none" className="overflow-hidden">
          <div className="border-b border-border/60 px-5 py-4">
            <SectionHeader
              title="QC Review Queue"
              description={`${filteredByTab.length.toLocaleString()} records${activeTab !== "all" ? " in selected tab" : ""}`}
            />
          </div>
          <div className="border-b border-border/60 bg-muted/20 px-4 py-2.5">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
                <TabPill
                  value="pending"
                  label="Pending"
                  count={stats.pending}
                  activeColor="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                />
                <TabPill
                  value="approved"
                  label="Approved"
                  count={stats.approved}
                  activeColor="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                />
                <TabPill
                  value="rejected"
                  label="Returned"
                  count={stats.rejected}
                  activeColor="data-[state=active]:bg-rose-600 data-[state=active]:text-white"
                />
                <TabPill
                  value="all"
                  label="All"
                  count={stats.totalInQueue}
                  activeColor="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                />
              </TabsList>
            </Tabs>
          </div>
          <div className="p-4">
            <SurveyTable rows={isLoading ? undefined : pagedRows} hrefBase="/qc" variant="qc" />
          </div>
        </GlassCard>

        <TablePagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          itemCount={filteredByTab.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => setPageNumber((p) => Math.max(1, p - 1))}
          onNext={() => setPageNumber((p) => (canGoNext ? p + 1 : p))}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={handlePageSizeChange}
        />
      </PageTransition>
    </RoleGate>
  );
}
