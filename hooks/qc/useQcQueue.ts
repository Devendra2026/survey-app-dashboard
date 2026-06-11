"use client";

import type { DateFilterState } from "@/components/surveys/survey-filters";
import type { SurveyRow } from "@/components/surveys/survey-tables";
import { useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { useQcWorkScope } from "@/hooks/qc/useQcWorkScope";
import { searchQcRegistry, useSurveyList } from "@/hooks/surveys/useSurveys";
import { computeQcWardStats, type QcWardRow } from "@/lib/qc/ward-stats";
import type { QcWorkScope } from "@/lib/qc/work-scope";
import { useCallback, useMemo, useState } from "react";

export type QcQueueStats = {
  pending: number;
  approved: number;
  drafts: number;
  submittedToday: number;
};

export type UseQcQueueOptions = {
  initialTab?: string;
};

export function useQcQueue(options: UseQcQueueOptions = {}) {
  const { scope, setScope, patchScope } = useQcWorkScope();
  const [dateFilters, setDateFilters] = useState<DateFilterState>({});
  const [registrySearch, setRegistrySearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState(options.initialTab ?? "pending");
  const [pageNumber, setPageNumber] = useState(1);

  const wardsForMuni = useWardsForMunicipality(scope.municipalityId);
  const wardLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of wardsForMuni ?? []) {
      if (w.wardNo && w.name) map.set(w.wardNo, w.name);
    }
    return map;
  }, [wardsForMuni]);

  const handleScopeChange = useCallback(
    (next: QcWorkScope) => {
      setScope(next);
      setPageNumber(1);
    },
    [setScope],
  );

  const handleDateFiltersChange = useCallback((next: DateFilterState) => {
    setDateFilters(next);
    setPageNumber(1);
  }, []);

  const handleRegistrySearchChange = useCallback((term: string) => {
    setRegistrySearch(term);
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
      wardNo: scope.wardNo,
      districtId: scope.districtId,
      municipalityId: scope.municipalityId,
      limit: 2000,
    }),
    [scope.wardNo, scope.districtId, scope.municipalityId],
  );

  const surveys = useSurveyList(listFilters);
  const isLoading = surveys === undefined;

  const registryFiltered = useMemo(
    () => (surveys ? searchQcRegistry(surveys as SurveyRow[], registrySearch) : surveys),
    [surveys, registrySearch],
  );

  const fromDateMs = useMemo(
    () => (dateFilters.fromDate ? new Date(`${dateFilters.fromDate}T00:00:00`).getTime() : undefined),
    [dateFilters.fromDate],
  );
  const toDateMs = useMemo(
    () => (dateFilters.toDate ? new Date(`${dateFilters.toDate}T23:59:59.999`).getTime() : undefined),
    [dateFilters.toDate],
  );

  const filteredByDate = useMemo(
    () =>
      (registryFiltered ?? []).filter((r) => {
        const ts = r.submittedAt ?? r._creationTime;
        if (fromDateMs !== undefined && ts < fromDateMs) return false;
        if (toDateMs !== undefined && ts > toDateMs) return false;
        return true;
      }),
    [registryFiltered, fromDateMs, toDateMs],
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
      drafts: rows.filter((r) => r.status === "draft").length,
      submittedToday: rows.filter((r) => r.status === "submitted" && (r.submittedAt ?? r._creationTime) >= todayMs)
        .length,
    };
  }, [filteredByDate]);

  const wardStats = useMemo(
    (): QcWardRow[] => computeQcWardStats(filteredByDate as SurveyRow[], wardLabels),
    [filteredByDate, wardLabels],
  );

  const rejectedCount = useMemo(() => filteredByDate.filter((r) => r.qcStatus === "rejected").length, [filteredByDate]);

  const pendingQueue = useMemo(
    () => (filteredByDate as SurveyRow[]).filter((r) => r.qcStatus === "pending" && r.status === "submitted"),
    [filteredByDate],
  );

  return {
    scope,
    dateFilters,
    registrySearch,
    activeTab,
    pageNumber,
    pageSize,
    pageStart,
    isLoading,
    stats,
    wardStats,
    rejectedCount,
    filteredByTab,
    pagedRows,
    pendingQueue,
    canGoPrev,
    canGoNext,
    handleScopeChange,
    handleDateFiltersChange,
    handleRegistrySearchChange,
    patchScope,
    handleTabChange,
    handlePageSizeChange,
    setPageNumber,
  };
}
