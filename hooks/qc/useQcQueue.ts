"use client";

import type { DateFilterState } from "@/components/surveys/survey-filters";
import type { SurveyRow } from "@/components/surveys/survey-tables";
import { useMasters, useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { useQcWorkScope } from "@/hooks/qc/useQcWorkScope";
import { searchQcRegistry, useSurveyList, useSurveyListPaginated } from "@/hooks/surveys/useSurveys";
import { computeQcWardStats, type QcWardRow } from "@/lib/qc/ward-stats";
import { sanitizeQcWorkScope, type QcWorkScope } from "@/lib/qc/work-scope";
import { qcTabToListFilters } from "@/lib/surveys/survey-list-filters";
import { useCallback, useMemo, useState } from "react";

/** Cap for aggregate stats / ward roll-ups on command center (avoids 2000-row bulk load). */
const QC_AGGREGATE_LIMIT = 500;

export type QcQueueStats = {
  pending: number;
  approved: number;
  drafts: number;
  submittedToday: number;
};

export type UseQcQueueOptions = {
  initialTab?: string;
  /** Command center only needs aggregates; registry uses cursor pagination for the table. */
  mode?: "command" | "registry";
};

export function useQcQueue(options: UseQcQueueOptions = {}) {
  const mode = options.mode ?? "registry";
  const { scope, setScope, patchScope, scopeReady } = useQcWorkScope();
  const { masters } = useMasters();

  const queryScope = useMemo(() => {
    if (!masters) return {} as QcWorkScope;
    return sanitizeQcWorkScope(scope, {
      municipalityIds: new Set(masters.ulbs.map((u) => u._id)),
      districtIds: new Set(masters.districts.map((d) => d._id)),
    });
  }, [scope, masters]);

  const [dateFilters, setDateFilters] = useState<DateFilterState>({});
  const [registrySearch, setRegistrySearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState(options.initialTab ?? "pending");

  const wardsForMuni = useWardsForMunicipality(scopeReady ? queryScope.municipalityId : undefined);
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
    },
    [setScope],
  );

  const handleDateFiltersChange = useCallback((next: DateFilterState) => {
    setDateFilters(next);
  }, []);

  const handleRegistrySearchChange = useCallback((term: string) => {
    setRegistrySearch(term);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  const scopeFilters = useMemo(
    () => ({
      wardNo: queryScope.wardNo,
      districtId: queryScope.districtId,
      municipalityId: queryScope.municipalityId,
    }),
    [queryScope.wardNo, queryScope.districtId, queryScope.municipalityId],
  );

  const tabFilters = useMemo(() => qcTabToListFilters(activeTab), [activeTab]);

  const aggregateSurveys = useSurveyList(scopeReady ? { ...scopeFilters, limit: QC_AGGREGATE_LIMIT } : {});

  const paginated = useSurveyListPaginated(
    { ...scopeFilters, ...tabFilters },
    pageSize,
    scopeReady && mode === "registry",
  );

  const isLoading =
    mode === "registry"
      ? paginated.isLoading || (scopeReady && aggregateSurveys === undefined)
      : aggregateSurveys === undefined;

  const registryFiltered = useMemo(() => {
    const rows = mode === "registry" ? paginated.surveys : aggregateSurveys;
    if (!rows) return rows;
    let filtered = searchQcRegistry(rows as SurveyRow[], registrySearch) as SurveyRow[];
    if (mode === "registry" && activeTab === "all") {
      filtered = filtered.filter((r) => r.status !== "draft" || r.qcStatus !== "pending");
    }
    return filtered;
  }, [mode, paginated.surveys, aggregateSurveys, registrySearch, activeTab]);

  const fromDateMs = useMemo(
    () => (dateFilters.fromDate ? new Date(`${dateFilters.fromDate}T00:00:00`).getTime() : undefined),
    [dateFilters.fromDate],
  );
  const toDateMs = useMemo(
    () => (dateFilters.toDate ? new Date(`${dateFilters.toDate}T23:59:59.999`).getTime() : undefined),
    [dateFilters.toDate],
  );

  const filteredByDate = useMemo(() => {
    const base = mode === "command" ? (aggregateSurveys ?? []) : (registryFiltered ?? []);
    return base.filter((r) => {
      const ts = r.submittedAt ?? r._creationTime;
      if (fromDateMs !== undefined && ts < fromDateMs) return false;
      if (toDateMs !== undefined && ts > toDateMs) return false;
      return true;
    }) as SurveyRow[];
  }, [mode, aggregateSurveys, registryFiltered, fromDateMs, toDateMs]);

  const filteredByTab = useMemo(() => {
    if (mode === "registry") {
      return (registryFiltered ?? []).filter((r) => {
        const ts = r.submittedAt ?? r._creationTime;
        if (fromDateMs !== undefined && ts < fromDateMs) return false;
        if (toDateMs !== undefined && ts > toDateMs) return false;
        return true;
      }) as SurveyRow[];
    }
    const rows = filteredByDate;
    if (activeTab === "pending") return rows.filter((r) => r.qcStatus === "pending" && r.status === "submitted");
    if (activeTab === "approved") return rows.filter((r) => r.qcStatus === "approved");
    if (activeTab === "rejected") return rows.filter((r) => r.qcStatus === "rejected");
    return rows.filter((r) => r.status !== "draft" || r.qcStatus !== "pending");
  }, [mode, registryFiltered, filteredByDate, activeTab, fromDateMs, toDateMs]);

  const pagedRows = useMemo(() => {
    if (mode === "registry") return filteredByTab;
    const pageStart = 0;
    return filteredByTab.slice(pageStart, pageStart + pageSize) as SurveyRow[];
  }, [mode, filteredByTab, pageSize]);

  const pageStart = mode === "registry" ? (paginated.pageNumber - 1) * pageSize : 0;
  const canGoPrev = mode === "registry" ? paginated.canGoPrev : false;
  const canGoNext = mode === "registry" ? paginated.canGoNext : false;

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
    (): QcWardRow[] => computeQcWardStats(filteredByDate, wardLabels),
    [filteredByDate, wardLabels],
  );

  const rejectedCount = useMemo(() => filteredByDate.filter((r) => r.qcStatus === "rejected").length, [filteredByDate]);

  return {
    scope,
    dateFilters,
    registrySearch,
    activeTab,
    pageNumber: mode === "registry" ? paginated.pageNumber : 1,
    pageSize,
    pageStart,
    isLoading,
    stats,
    wardStats,
    rejectedCount,
    filteredByTab,
    pagedRows,
    canGoPrev,
    canGoNext,
    handleScopeChange,
    handleDateFiltersChange,
    handleRegistrySearchChange,
    patchScope,
    handleTabChange,
    handlePageSizeChange,
    goNext: paginated.goNext,
    goPrev: paginated.goPrev,
  };
}
