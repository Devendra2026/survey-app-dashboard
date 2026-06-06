"use client";

import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { BarChart3, CheckCircle2, ClipboardCheck, Clock3, Filter, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  border: string;
  gradient: string;
  iconRing: string;
  textColor: string;
  sub?: string;
}

function StatCard({ title, value, icon, border, gradient, iconRing, textColor, sub }: StatCardProps) {
  return (
    <Card className={`relative overflow-hidden ${border} ${gradient} shadow-sm transition-shadow hover:shadow-md`}>
      <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10 dark:bg-white/5" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1 pt-4">
        <CardTitle className={`text-[11px] font-bold uppercase tracking-widest ${textColor}`}>{title}</CardTitle>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconRing}`}>{icon}</div>
      </CardHeader>
      <CardContent className="pb-4 pt-1">
        <p className={`text-4xl font-black tabular-nums leading-none ${textColor}`}>{value}</p>
        {sub && <p className={`mt-1.5 text-[11px] font-medium opacity-70 ${textColor}`}>{sub}</p>}
      </CardContent>
    </Card>
  );
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
      className={`flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground ${activeColor}`}
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const pending = rows.filter((r) => r.qcStatus === "pending" && r.status === "submitted").length;
    const approved = rows.filter((r) => r.qcStatus === "approved").length;
    const rejected = rows.filter((r) => r.qcStatus === "rejected").length;
    const reviewedToday = rows.filter(
      (r) => r.qcStatus !== "pending" && (r.submittedAt ?? r._creationTime) >= todayMs,
    ).length;
    const totalInQueue = pending + approved + rejected;
    const approvalRate = approved + rejected > 0 ? ((approved / (approved + rejected)) * 100).toFixed(1) : "0.0";

    return { pending, approved, rejected, reviewedToday, totalInQueue, approvalRate };
  }, [filteredByDate]);

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control is available to supervisors and administrators."
    >
      <div className="space-y-6 text-foreground">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-linear-to-r from-amber-50 via-orange-50 to-yellow-50 px-6 py-6 shadow-sm dark:border-amber-800/30 dark:from-amber-950/60 dark:via-orange-950/50 dark:to-yellow-950/40">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-28 w-28 rounded-full bg-orange-300/20 blur-2xl dark:bg-orange-500/10" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/60">
                  <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-amber-900 dark:text-amber-100">
                  Quality Control
                </h1>
              </div>
              <p className="text-sm text-amber-700/70 dark:text-amber-400/70">
                Review submitted surveys, approve or return for correction.
              </p>
            </div>
          </div>
        </div>

        {/* KPI stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Pending Review"
            value={stats.pending.toLocaleString()}
            sub="awaiting QC decision"
            icon={<Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            border="border-amber-500/30"
            gradient="bg-linear-to-br from-amber-500/10 via-card to-card dark:from-amber-500/20 dark:via-amber-950/10"
            iconRing="bg-amber-100 dark:bg-amber-900/50"
            textColor="text-amber-700 dark:text-amber-300"
          />
          <StatCard
            title="Approved"
            value={stats.approved.toLocaleString()}
            sub="QC passed"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            border="border-emerald-500/30"
            gradient="bg-linear-to-br from-emerald-500/10 via-card to-card dark:from-emerald-500/20 dark:via-emerald-950/10"
            iconRing="bg-emerald-100 dark:bg-emerald-900/50"
            textColor="text-emerald-700 dark:text-emerald-300"
          />
          <StatCard
            title="Returned"
            value={stats.rejected.toLocaleString()}
            sub="sent back to surveyor"
            icon={<TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
            border="border-rose-500/30"
            gradient="bg-linear-to-br from-rose-500/10 via-card to-card dark:from-rose-500/20 dark:via-rose-950/10"
            iconRing="bg-rose-100 dark:bg-rose-900/50"
            textColor="text-rose-700 dark:text-rose-300"
          />
          <StatCard
            title="In Scope"
            value={stats.totalInQueue.toLocaleString()}
            sub="in active filters"
            icon={<BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
            border="border-violet-500/30"
            gradient="bg-linear-to-br from-violet-500/10 via-card to-card dark:from-violet-500/20 dark:via-violet-950/10"
            iconRing="bg-violet-100 dark:bg-violet-900/50"
            textColor="text-violet-700 dark:text-violet-300"
          />
          <StatCard
            title="Approval Rate"
            value={`${stats.approvalRate}%`}
            sub={`${stats.approved} of ${stats.approved + stats.rejected} decided`}
            icon={<ClipboardCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
            border="border-cyan-500/30"
            gradient="bg-linear-to-br from-cyan-500/10 via-card to-card dark:from-cyan-500/20 dark:via-cyan-950/10"
            iconRing="bg-cyan-100 dark:bg-cyan-900/50"
            textColor="text-cyan-700 dark:text-cyan-300"
          />
        </div>

        {/* Advanced filters */}
        <Card className="border-primary/15 bg-linear-to-br from-primary/5 via-card to-card shadow-sm dark:from-primary/10 dark:via-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary/80 dark:text-primary/70">
              <Filter className="h-3.5 w-3.5" />
              Filter Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SurveyFilters value={filters} onChange={handleFiltersChange} showStatus={false} showQcStatus={false} />
          </CardContent>
        </Card>

        {/* QC records table */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-linear-to-r from-amber-50/80 to-card px-5 py-4 dark:from-amber-950/30 dark:to-card">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">QC Review Queue</h2>
              <p className="text-xs text-muted-foreground">
                {filteredByTab.length.toLocaleString()} records
                {activeTab !== "all" ? " in selected tab" : " total"}
              </p>
            </div>
          </div>

          <div className="border-b border-border/60 bg-muted/20 px-4 py-2.5 dark:bg-muted/10">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
                <TabPill
                  value="pending"
                  label="Pending"
                  count={stats.pending}
                  activeColor="data-[state=active]:bg-amber-500  data-[state=active]:text-white  dark:data-[state=active]:bg-amber-500"
                />
                <TabPill
                  value="approved"
                  label="Approved"
                  count={stats.approved}
                  activeColor="data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-500"
                />
                <TabPill
                  value="rejected"
                  label="Returned"
                  count={stats.rejected}
                  activeColor="data-[state=active]:bg-rose-600   data-[state=active]:text-white  dark:data-[state=active]:bg-rose-500"
                />
                <TabPill
                  value="all"
                  label="All"
                  count={stats.totalInQueue}
                  activeColor="data-[state=active]:bg-slate-700  data-[state=active]:text-white  dark:data-[state=active]:bg-slate-600"
                />
              </TabsList>
            </Tabs>
          </div>

          <CardContent className="p-0">
            <div className="p-4">
              <SurveyTable rows={isLoading ? undefined : pagedRows} hrefBase="/qc" variant="qc" />
            </div>
          </CardContent>
        </Card>

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
      </div>
    </RoleGate>
  );
}
