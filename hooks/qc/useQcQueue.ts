"use client";

import type { FilterState } from "@/components/surveys/survey-filters";
import type { SurveyRow } from "@/components/surveys/survey-tables";
import { useMasters, useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import { computeQcWardStats, type QcWardRow } from "@/lib/qc/ward-stats";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { useCallback, useMemo, useState } from "react";

export type QcQueueStats = {
  pending: number;
  approved: number;
  submittedToday: number;
};

export type UseQcQueueOptions = {
  initialFilters?: FilterState;
  initialTab?: string;
};

export function useQcQueue(options: UseQcQueueOptions = {}) {
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [filters, setFilters] = useState<FilterState>(options.initialFilters ?? { search: "" });
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState(options.initialTab ?? "pending");
  const [pageNumber, setPageNumber] = useState(1);

  const wardsForMuni = useWardsForMunicipality(filters.municipalityId);
  const wardLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of wardsForMuni ?? []) {
      if (w.wardNo && w.name) map.set(w.wardNo, w.name);
    }
    return map;
  }, [wardsForMuni]);

  const handleFiltersChange = useCallback((next: FilterState) => {
    setFilters(next);
    setPageNumber(1);
  }, []);
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setPageNumber(1);
  }, []);
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPageNumber(1);
  }, []);

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

    return {
      pending: rows.filter((r) => r.qcStatus === "pending" && r.status === "submitted").length,
      approved: rows.filter((r) => r.qcStatus === "approved").length,
      submittedToday: rows.filter((r) => r.status === "submitted" && (r.submittedAt ?? r._creationTime) >= todayMs)
        .length,
    };
  }, [filteredByDate]);

  const wardStats = useMemo(
    (): QcWardRow[] => computeQcWardStats(filteredByDate as SurveyRow[], wardLabels),
    [filteredByDate, wardLabels],
  );

  const rejectedCount = useMemo(() => filteredByDate.filter((r) => r.qcStatus === "rejected").length, [filteredByDate]);

  return {
    filters,
    activeTab,
    pageNumber,
    pageSize,
    isLoading,
    stats,
    wardStats,
    rejectedCount,
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
