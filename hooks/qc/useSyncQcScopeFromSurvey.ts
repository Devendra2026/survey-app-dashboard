"use client";

import { scopeFromSurveyRow } from "@/lib/qc/work-scope";
import type { SurveyListItem } from "@/schema/surveys/index";
import { useEffect } from "react";

/** Align QC queue filters with the survey being reviewed — avoids stale localStorage ULB ids. */
export function useSyncQcScopeFromSurvey(
  survey: Pick<SurveyListItem, "_id" | "municipalityId" | "districtId" | "wardNo"> | null | undefined,
  patchScope: (patch: ReturnType<typeof scopeFromSurveyRow>) => void,
) {
  const surveyId = survey?._id;

  useEffect(() => {
    if (!survey) return;
    patchScope(scopeFromSurveyRow(survey));
    // Scope tracks the open survey; re-sync only when navigating to another record.
  }, [surveyId, patchScope, survey]);
}
