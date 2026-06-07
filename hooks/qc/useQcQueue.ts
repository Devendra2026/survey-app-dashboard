"use client";

import type { FilterState } from "@/components/surveys/survey-filters";
import type { SurveyRow } from "@/components/surveys/survey-tables";
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { useMemo, useState } from "react";

export type QcQueueStats = {
  pending: number;
  approved: number;
  rejected: number;
  totalInQueue: number;
  submittedToday: number;
  approvalRate: string;
};

export function useQcQueue() {
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
    () => filteredByTab.slice(pageStart, pageStart + pageSize) as SurveyRow[],
    [filteredByTab, pageStart, pageSize],
  );
  const canGoPrev = pageNumber > 1;
  const canGoNext = pageStart + pageSize < filteredByTab.length;

  const stats = useMemo((): QcQueueStats => {
    const rows = filteredByDate;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const pending = rows.filter((r) => r.qcStatus === "pending" && r.status === "submitted").length;
    const approved = rows.filter((r) => r.qcStatus === "approved").length;
    const rejected = rows.filter((r) => r.qcStatus === "rejected").length;
    const totalInQueue = pending + approved + rejected;
    const submittedToday = rows.filter(
      (r) => r.status === "submitted" && (r.submittedAt ?? r._creationTime) >= todayMs,
    ).length;
    const approvalRate = approved + rejected > 0 ? ((approved / (approved + rejected)) * 100).toFixed(1) : "0.0";
    return { pending, approved, rejected, totalInQueue, submittedToday, approvalRate };
  }, [filteredByDate]);

  const nextPending = useMemo(
    () => filteredByDate.find((r) => r.qcStatus === "pending" && r.status === "submitted"),
    [filteredByDate],
  );

  const pipelineStage =
    activeTab === "pending"
      ? "pending"
      : activeTab === "approved"
        ? "approved"
        : activeTab === "rejected"
          ? "rejected"
          : undefined;

  return {
    filters,
    activeTab,
    pageNumber,
    pageSize,
    isLoading,
    stats,
    nextPending,
    pipelineStage,
    filteredByTab,
    pagedRows,
    canGoPrev,
    canGoNext,
    handleFiltersChange,
    handleTabChange,
    handlePageSizeChange,
    setPageNumber,
  };
}
