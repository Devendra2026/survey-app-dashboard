/** Persisted geographic scope for QC supervisors — set once via Smart Filters on the command center. */

export type QcWorkScope = {
  districtId?: string;
  municipalityId?: string;
  wardNo?: string;
};

const STORAGE_KEY = "qc-work-scope";

export function readQcWorkScope(): QcWorkScope {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as QcWorkScope;
    return {
      districtId: parsed.districtId || undefined,
      municipalityId: parsed.municipalityId || undefined,
      wardNo: parsed.wardNo || undefined,
    };
  } catch {
    return {};
  }
}

export function writeQcWorkScope(scope: QcWorkScope): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
}

export function scopeFromUserAssignment(user: {
  districtId?: string;
  municipalityId?: string;
  wardAssignments?: string[];
}): QcWorkScope {
  const scope: QcWorkScope = {};
  if (user.districtId) scope.districtId = user.districtId;
  if (user.municipalityId) scope.municipalityId = user.municipalityId;
  if (user.wardAssignments?.[0]) scope.wardNo = user.wardAssignments[0];
  return scope;
}

export function isQcScopeComplete(scope: QcWorkScope): boolean {
  return Boolean(scope.municipalityId && scope.wardNo);
}

export type QcTenantAllowlist = {
  municipalityIds: ReadonlySet<string>;
  districtIds: ReadonlySet<string>;
};

/** Drop ULB/district filters that are outside the caller's tenant catalog. */
export function sanitizeQcWorkScope(scope: QcWorkScope, allowed: QcTenantAllowlist): QcWorkScope {
  const next: QcWorkScope = { ...scope };

  if (next.municipalityId && !allowed.municipalityIds.has(next.municipalityId)) {
    delete next.municipalityId;
    delete next.wardNo;
  }

  if (next.districtId && !allowed.districtIds.has(next.districtId)) {
    delete next.districtId;
  }

  return next;
}

export function scopeFromSurveyRow(survey: {
  municipalityId?: string;
  districtId?: string;
  wardNo?: string;
}): QcWorkScope {
  return {
    municipalityId: survey.municipalityId,
    districtId: survey.districtId,
    wardNo: survey.wardNo,
  };
}
