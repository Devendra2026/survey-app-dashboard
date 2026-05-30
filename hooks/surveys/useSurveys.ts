"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { useMutation, useQuery } from "convex/react";

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
