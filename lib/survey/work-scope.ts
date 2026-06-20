/** Persisted geographic + status scope for field survey supervisors. */

export type SurveyWorkScope = {
  districtId?: string;
  municipalityId?: string;
  wardNo?: string;
  status?: string;
  qcStatus?: string;
};

const STORAGE_KEY = "survey-work-scope";

export function readSurveyWorkScope(): SurveyWorkScope {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SurveyWorkScope;
    return {
      districtId: parsed.districtId || undefined,
      municipalityId: parsed.municipalityId || undefined,
      wardNo: parsed.wardNo || undefined,
      status: parsed.status || undefined,
      qcStatus: parsed.qcStatus || undefined,
    };
  } catch {
    return {};
  }
}

export function writeSurveyWorkScope(scope: SurveyWorkScope): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
}

export function scopeFromUserAssignment(user: {
  districtId?: string;
  municipalityId?: string;
  wardAssignments?: string[];
}): SurveyWorkScope {
  const scope: SurveyWorkScope = {};
  if (user.districtId) scope.districtId = user.districtId;
  if (user.municipalityId) scope.municipalityId = user.municipalityId;
  if (user.wardAssignments?.[0]) scope.wardNo = user.wardAssignments[0];
  return scope;
}

export function isSurveyScopeComplete(scope: SurveyWorkScope): boolean {
  return Boolean(scope.municipalityId);
}

export type SurveyTenantAllowlist = {
  municipalityIds: ReadonlySet<string>;
  districtIds: ReadonlySet<string>;
};

export function sanitizeSurveyWorkScope(scope: SurveyWorkScope, allowed: SurveyTenantAllowlist): SurveyWorkScope {
  const next: SurveyWorkScope = { ...scope };

  if (next.municipalityId && !allowed.municipalityIds.has(next.municipalityId)) {
    delete next.municipalityId;
    delete next.wardNo;
  }

  if (next.districtId && !allowed.districtIds.has(next.districtId)) {
    delete next.districtId;
  }

  return next;
}

function scopeFromSurveyRow(survey: {
  municipalityId?: string;
  districtId?: string;
  wardNo?: string;
}): SurveyWorkScope {
  return {
    municipalityId: survey.municipalityId,
    districtId: survey.districtId,
    wardNo: survey.wardNo,
  };
}
