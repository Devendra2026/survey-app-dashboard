"use client";

import type { FilterState } from "@/components/surveys/survey-filters";
import { api } from "@/convex/_generated/api";
import { useDashboardCounts, useStatsBreakdown } from "@/hooks/analytics/useAnalytics";
import { useSurveyListPaginated } from "@/hooks/surveys/useSurveys";
import { useHasCapability } from "@/hooks/use-capability";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { estimateQcPendingCount, surveyTabToListFilters } from "@/lib/surveys/survey-list-filters";
import type { DashboardCounts } from "@/schema/analytics";
import { useQuery } from "convex/react";
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

export type SurveysPageStats = {
  total: number;
  today: number;
  submittedToday?: number;
  qcPending: number;
  approved: number;
  rejected: number;
};

export function useSurveysPage() {
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
  const [registrySearch, setRegistrySearch] = useState("");
  const [listUi, dispatchListUi] = useReducer(surveysListUiReducer, {
    filters: {},
    pageSize: 20,
    activeTab: "all",
  });
  const { filters, pageSize, activeTab } = listUi;

  const fromMs = useMemo(
    () => (filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`).getTime() : undefined),
    [filters.fromDate],
  );
  const toMs = useMemo(
    () => (filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`).getTime() : undefined),
    [filters.toDate],
  );

  const listFilters = useMemo(
    () => ({
      status: filters.status as SurveyStatus | undefined,
      qcStatus: filters.qcStatus as QcStatus | undefined,
      wardNo: filters.wardNo,
      districtId: filters.districtId,
      municipalityId: filters.municipalityId,
      surveyorId: canViewAll ? filters.surveyorId : undefined,
      fromMs,
      toMs,
      searchTerm: registrySearch.trim() || undefined,
      ...surveyTabToListFilters(activeTab),
    }),
    [filters, canViewAll, activeTab, fromMs, toMs, registrySearch],
  );

  const { surveys, isLoading, pageNumber, pageIndex, canGoPrev, canGoNext, goNext, goPrev } = useSurveyListPaginated(
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

  const pageStart = pageIndex * pageSize;

  const pagedRows = surveys;

  const stats = useMemo((): SurveysPageStats => {
    if (showAnalytics && breakdown?.summary) {
      const s = breakdown.summary;
      return {
        total: s.total,
        today: s.today,
        qcPending: estimateQcPendingCount(s),
        approved: s.approved,
        rejected: s.rejected,
      };
    }
    if (dashCounts) {
      const s: DashboardCounts = dashCounts;
      return {
        total: s.total,
        today: s.today,
        submittedToday: s.submittedToday,
        qcPending: s.pending,
        approved: s.approved,
        rejected: s.rejected,
      };
    }
    return {
      total: 0,
      today: 0,
      submittedToday: 0,
      qcPending: 0,
      approved: 0,
      rejected: 0,
    };
  }, [showAnalytics, breakdown, dashCounts]);

  const draftCount = (showAnalytics ? breakdown?.summary?.drafts : dashCounts?.drafts) ?? 0;
  const submittedCount = (showAnalytics ? breakdown?.summary?.submitted : dashCounts?.submitted) ?? 0;
  const metricsReady = showAnalytics ? breakdown !== undefined : dashCounts !== undefined;

  return {
    canViewAll,
    canReassign,
    reassignOpen,
    setReassignOpen,
    listFilters,
    filters,
    dispatchListUi,
    surveyorOptions,
    registrySearch,
    setRegistrySearch,
    isLoading,
    pagedRows,
    pageNumber,
    pageStart,
    canGoPrev,
    canGoNext,
    goNext,
    goPrev,
    pageSize,
    activeTab,
    stats,
    draftCount,
    submittedCount,
    metricsReady,
    showAnalytics,
  };
}
