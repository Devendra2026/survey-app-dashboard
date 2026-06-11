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
