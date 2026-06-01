"use client";
/**
 * Survey feature hooks — thin bindings over `api.survey.*` (see `convex/survey.ts`).
 * No business logic lives here; filtering/search beyond what the server
 * supports is applied client-side over the already tenant-scoped result.
 */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";

export interface SurveyListFilters {
  status?: SurveyStatus;
  qcStatus?: QcStatus;
  wardNo?: string;
  districtId?: string;
  municipalityId?: string;
  surveyorId?: string;
  limit?: number;
}

/** api.survey.list — server enforces tenant scope + role visibility. */
export function useSurveyList(filters: SurveyListFilters = {}) {
  return useQuery(api.survey.list, {
    status: filters.status,
    qcStatus: filters.qcStatus,
    wardNo: filters.wardNo,
    districtId: filters.districtId as Id<"districts"> | undefined,
    municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
    surveyorId: filters.surveyorId as Id<"users"> | undefined,
    limit: filters.limit ?? 200,
  });
}

/** Cursor-paginated survey list sorted by Property ID ascending. */
export function useSurveyListPaginated(filters: SurveyListFilters = {}, pageSize = 20) {
  const resetKey = `${filters.status ?? ""}|${filters.qcStatus ?? ""}|${filters.wardNo ?? ""}|${filters.districtId ?? ""}|${filters.municipalityId ?? ""}|${filters.surveyorId ?? ""}`;
  const {
    cursor,
    pageIndex,
    pageSize: size,
    canGoPrev,
    goNext,
    goPrev,
    pageNumber,
  } = useCursorPagination(resetKey, pageSize);

  const result = useQuery(api.survey.listPaginated, {
    paginationOpts: { numItems: size, cursor },
    status: filters.status,
    qcStatus: filters.qcStatus,
    wardNo: filters.wardNo,
    districtId: filters.districtId as Id<"districts"> | undefined,
    municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
    surveyorId: filters.surveyorId as Id<"users"> | undefined,
  });

  const surveys = result?.page;
  const canGoNext = result ? !result.isDone : false;

  return useMemo(
    () => ({
      surveys,
      isLoading: result === undefined,
      pageNumber,
      pageIndex,
      pageSize: size,
      canGoPrev,
      canGoNext,
      goNext: () => {
        if (result) goNext(result.continueCursor, result.isDone);
      },
      goPrev,
    }),
    [surveys, result, pageNumber, pageIndex, size, canGoPrev, canGoNext, goNext, goPrev],
  );
}

/** api.survey.get — full detail w/ floors, photos (hydrated URLs), qcRemarks. */
export function useSurvey(id: string | undefined) {
  return useQuery(api.survey.get, id ? { id: id as Id<"surveys"> } : "skip");
}

export function useSubmitSurvey() {
  return useMutation(api.survey.submit);
}
export function useRemoveSurvey() {
  return useMutation(api.survey.remove);
}
export function useUpsertSurvey() {
  return useMutation(api.survey.upsert);
}
export function useSaveDraft() {
  return useMutation(api.survey.saveDraft);
}
export function useSetGps() {
  return useMutation(api.survey.setGps);
}

/**
 * Client-side search over the scoped list — Property ID, Owner Name, Mobile,
 * Parcel No. The backend has no text index (faithful to schema), so we filter
 * the already-authorized rows in memory. For very large tenants, add a Convex
 * search index later; the call site stays identical.
 */
export function searchSurveys<
  T extends {
    propertyId?: string;
    respondentName?: string;
    mobileNo?: string;
    parcelNo?: string;
    owners?: { name?: string }[];
  },
>(rows: T[], term: string): T[] {
  const q = term.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    [r.propertyId, r.respondentName, r.mobileNo, r.parcelNo, ...(r.owners?.map((o) => o.name) ?? [])]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q)),
  );
}
