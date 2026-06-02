"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { SurveyExcelActions } from "@/components/surveys/survey-excel-actions";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function SurveysPage() {
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [filters, setFilters] = useState<FilterState>({ search: "" });
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);

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
  const fromDateMs = useMemo(() => {
    if (!filters.fromDate) return undefined;
    return new Date(`${filters.fromDate}T00:00:00`).getTime();
  }, [filters.fromDate]);
  const toDateMs = useMemo(() => {
    if (!filters.toDate) return undefined;
    return new Date(`${filters.toDate}T23:59:59.999`).getTime();
  }, [filters.toDate]);
  const inDateRange = (createdAt: number) => {
    if (fromDateMs !== undefined && createdAt < fromDateMs) return false;
    if (toDateMs !== undefined && createdAt > toDateMs) return false;
    return true;
  };
  const filteredByDate = useMemo(
    () => (filtered ?? []).filter((r: any) => inDateRange(r._creationTime)),
    [filtered, fromDateMs, toDateMs],
  );
  const filteredByTab = useMemo(() => {
    const rows = filteredByDate ?? [];
    if (activeTab === "all") return rows;
    if (activeTab === "qcPending") return rows.filter((r: any) => r.qcStatus === "pending");
    if (activeTab === "qcApproved") return rows.filter((r: any) => r.qcStatus === "approved");
    if (activeTab === "qcRejected") return rows.filter((r: any) => r.qcStatus === "rejected");
    if (activeTab === "draft") return rows.filter((r: any) => r.status === "draft");
    if (activeTab === "submitted") return rows.filter((r: any) => r.status === "submitted");
    return rows;
  }, [filteredByDate, activeTab]);
  useEffect(() => {
    setPageNumber(1);
  }, [filters, activeTab, pageSize]);

  const pageStart = (pageNumber - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredByTab.slice(pageStart, pageStart + pageSize),
    [filteredByTab, pageStart, pageSize],
  );
  const canGoPrev = pageNumber > 1;
  const canGoNext = pageStart + pageSize < filteredByTab.length;
  const stats = useMemo(() => {
    const rows = filteredByDate;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();
    const total = rows.length;
    const month = rows.length;
    const today = rows.filter((r: any) => r._creationTime >= startOfTodayMs).length;
    const qcPending = rows.filter((r: any) => r.qcStatus === "pending").length;
    const approved = rows.filter((r: any) => r.qcStatus === "approved").length;
    const rejected = rows.filter((r: any) => r.qcStatus === "rejected").length;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : "0.0";
    return { total, month, today, qcPending, approved, rejectionRate };
  }, [filteredByDate]);

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Survey Operations"
        description="Monitor and manage property data collection lifecycle."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RoleGate
              capability="reports.export"
              fallback={<SurveyExcelActions filters={listFilters} disabled={isLoading} />}
            >
              <SurveyExcelActions filters={listFilters} canImport disabled={isLoading} />
            </RoleGate>
            <RoleGate capability="surveys.editDraft">
              <Button asChild>
                <Link href="/surveys/new">
                  <Plus className="h-4 w-4" /> New Survey
                </Link>
              </Button>
            </RoleGate>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="overflow-hidden border-cyan-500/30 bg-linear-to-br from-cyan-500/15 via-card to-card shadow-sm dark:from-cyan-500/20 dark:via-cyan-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-cyan-700 dark:text-cyan-200">
              Month Surveys
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold tabular-nums text-cyan-700 dark:text-cyan-200">
              {stats.month.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-amber-500/30 bg-linear-to-br from-amber-500/15 via-card to-card shadow-sm dark:from-amber-500/20 dark:via-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-amber-700 dark:text-amber-200">
              QC Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold tabular-nums text-amber-700 dark:text-amber-200">
              {stats.qcPending.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-emerald-500/30 bg-linear-to-br from-emerald-500/15 via-card to-card shadow-sm dark:from-emerald-500/20 dark:via-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-emerald-700 dark:text-emerald-200">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-200">
              {stats.approved.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-violet-500/30 bg-linear-to-br from-violet-500/15 via-card to-card shadow-sm dark:from-violet-500/20 dark:via-violet-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-violet-700 dark:text-violet-200">
              Today Surveys
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold tabular-nums text-violet-700 dark:text-violet-200">
              {stats.today.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-rose-500/30 bg-linear-to-br from-rose-500/15 via-card to-card shadow-sm dark:from-rose-500/20 dark:via-rose-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-rose-700 dark:text-rose-200">
              Rejection Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold tabular-nums text-rose-700 dark:text-rose-200">
              {stats.rejectionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/15 bg-linear-to-br from-primary/5 via-card to-card shadow-sm dark:from-primary/10 dark:via-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.14em] text-primary/80 dark:text-primary/70">
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SurveyFilters value={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur-sm dark:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xl font-semibold tracking-tight">Survey Records</CardTitle>
          <p className="text-sm text-muted-foreground">{filteredByTab.length.toLocaleString()} records in active tab</p>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-xl border border-border/70 bg-muted/40 p-2 dark:bg-muted/20">
              <TabsTrigger
                value="all"
                className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                All ({filteredByDate.length})
              </TabsTrigger>
              <TabsTrigger
                value="qcPending"
                className="text-xs font-medium data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-300"
              >
                QC Pending ({stats.qcPending})
              </TabsTrigger>
              <TabsTrigger
                value="qcApproved"
                className="text-xs font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300"
              >
                QC Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger
                value="qcRejected"
                className="text-xs font-medium data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-700 dark:data-[state=active]:text-rose-300"
              >
                QC Rejected ({filteredByDate.filter((r: any) => r.qcStatus === "rejected").length})
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="text-xs font-medium data-[state=active]:bg-slate-500/15 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-300"
              >
                Draft ({filteredByDate.filter((r: any) => r.status === "draft").length})
              </TabsTrigger>
              <TabsTrigger
                value="submitted"
                className="text-xs font-medium data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-300"
              >
                Submitted ({filteredByDate.filter((r: any) => r.status === "submitted").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-4">
            <SurveyTable rows={isLoading ? undefined : (pagedRows as any)} />
          </div>
        </CardContent>
      </Card>
      <TablePagination
        pageNumber={pageNumber}
        pageSize={pageSize}
        itemCount={pagedRows.length}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={() => setPageNumber((p) => Math.max(1, p - 1))}
        onNext={() => setPageNumber((p) => (canGoNext ? p + 1 : p))}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
