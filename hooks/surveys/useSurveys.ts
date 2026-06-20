"use client";
/**
 * Survey feature hooks — thin bindings over `api.survey.*` (see `convex/survey.ts`).
 * No business logic lives here; filtering/search beyond what the server
 * supports is applied client-side over the already tenant-scoped result.
 */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { formatRegistryParcelNo, formatRegistryWardNo } from "@/lib/survey/format-registry-parcel";
import { resolveDisplayPropertyId, type PropertyIdSource } from "@/lib/survey/resolve-display-property-id";
import { useQuery as useConvexQuery, useMutation } from "convex/react";
import { useMemo } from "react";

export interface SurveyListFilters {
  status?: SurveyStatus;
  qcStatus?: QcStatus;
  qcStatuses?: QcStatus[];
  wardNo?: string;
  districtId?: string;
  municipalityId?: string;
  surveyorId?: string;
  fromMs?: number;
  toMs?: number;
  limit?: number;
  searchTerm?: string;
}

/** api.survey.list — server enforces tenant scope + role visibility. */
export function useSurveyList(filters: SurveyListFilters = {}, enabled = true) {
  const ready = useConvexAuthReady();
  return useConvexQuery(
    api.survey.list,
    ready && enabled
      ? {
          status: filters.status,
          qcStatus: filters.qcStatus,
          qcStatuses: filters.qcStatuses,
          wardNo: filters.wardNo,
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
          surveyorId: filters.surveyorId as Id<"users"> | undefined,
          limit: filters.limit ?? 200,
        }
      : "skip",
  );
}

/** Cursor-paginated survey list sorted by ward then parcel ascending. */
export function useSurveyListPaginated(filters: SurveyListFilters = {}, pageSize = 20, enabled = true) {
  const searchKey = filters.searchTerm?.trim() ?? "";
  const resetKey = `${filters.status ?? ""}|${filters.qcStatus ?? ""}|${(filters.qcStatuses ?? []).join(",")}|${filters.wardNo ?? ""}|${filters.districtId ?? ""}|${filters.municipalityId ?? ""}|${filters.surveyorId ?? ""}|${filters.fromMs ?? ""}|${filters.toMs ?? ""}|${searchKey}`;
  const {
    cursor,
    pageIndex,
    pageSize: size,
    canGoPrev,
    goNext,
    goPrev,
    pageNumber,
  } = useCursorPagination(resetKey, pageSize);

  const ready = useConvexAuthReady();
  const result = useConvexQuery(
    api.survey.listPaginated,
    ready && enabled
      ? {
          paginationOpts: { numItems: size, cursor },
          status: filters.status,
          qcStatus: filters.qcStatus,
          qcStatuses: filters.qcStatuses,
          wardNo: filters.wardNo,
          districtId: filters.districtId as Id<"districts"> | undefined,
          municipalityId: filters.municipalityId as Id<"municipalities"> | undefined,
          surveyorId: filters.surveyorId as Id<"users"> | undefined,
          fromMs: filters.fromMs,
          toMs: filters.toMs,
          searchTerm: searchKey || undefined,
        }
      : "skip",
  );

  const surveys = result?.page;
  const totalCount = result?.totalCount;
  const canGoNext = result ? !result.isDone : false;

  return useMemo(
    () => ({
      surveys,
      totalCount,
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
    [surveys, totalCount, result, pageNumber, pageIndex, size, canGoPrev, canGoNext, goNext, goPrev],
  );
}

/** api.survey.get — full detail w/ floors, photos (hydrated URLs), qcRemarks. */
export function useSurvey(id: string | undefined) {
  const ready = useConvexAuthReady();
  return useConvexQuery(api.survey.get, ready && id ? { id: id as Id<"surveys"> } : "skip");
}

export function useSubmitSurvey() {
  return useMutation(api.survey.submit);
}
export function useRemoveSurvey() {
  return useMutation(api.survey.remove);
}
function useUpsertSurvey() {
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
function searchSurveys<
  T extends PropertyIdSource & {
    respondentName?: string;
    mobileNo?: string;
    parcelNo?: string;
    wardNo?: string;
    owners?: { name?: string }[];
  },
>(rows: T[], term: string, ulbCodes?: Map<string, string>): T[] {
  const q = term.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => {
    const displayId = resolveDisplayPropertyId(r, ulbCodes);
    return [
      displayId,
      r.propertyId,
      r.respondentName,
      r.mobileNo,
      r.parcelNo,
      formatRegistryParcelNo(r.parcelNo),
      formatRegistryWardNo(r.wardNo),
      ...(r.owners?.map((o) => o.name) ?? []),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
}

/** QC registry search — property ID, owner name, parcel number, and ward number. */
export function searchQcRegistry<
  T extends PropertyIdSource & {
    respondentName?: string;
    parcelNo?: string;
    wardNo?: string;
    owners?: { name?: string }[];
  },
>(rows: T[], term: string, ulbCodes?: Map<string, string>): T[] {
  const q = term.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => {
    const displayId = resolveDisplayPropertyId(r, ulbCodes);
    const wardVariants = [
      r.wardNo,
      formatRegistryWardNo(r.wardNo),
      r.wardNo ? `ward ${r.wardNo}` : undefined,
      r.wardNo ? `w${r.wardNo}` : undefined,
    ];
    return [
      displayId,
      r.propertyId,
      r.respondentName,
      r.parcelNo,
      formatRegistryParcelNo(r.parcelNo),
      ...wardVariants,
      ...(r.owners?.map((o) => o.name) ?? []),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
}
