/**
 * permissions.ts — Role → capability matrix for the WEB UI.
 *
 * ⚠️  This is a UI-gating convenience ONLY. The authoritative enforcement is
 *     server-side in Convex (`requireRole`, `assertMunicipalityInScope`,
 *     `assertCanReadWard`, and the per-mutation checks in surveys.ts / qc.ts /
 *     admin.ts). Never treat a `can()` result as a security boundary — if the
 *     UI lets a call through, the server still rejects it. This file exists so
 *     we hide actions a user definitely cannot perform, not to *grant* them.
 *
 * The capability names below are derived directly from the brief's role matrix
 * and cross-checked against the actual Convex function guards:
 *   - admin functions: admin.ts (`requireRole(me, 'admin')`)
 *   - qc.decide / qc.reopen: `requireRole(me, 'supervisor', 'admin')`
 *   - survey edit/submit: surveyor (own) + supervisor/admin (scope)
 */

export type Role = "pending" | "surveyor" | "supervisor" | "admin";

export type Capability =
  // user management (admin only)
  | "users.approve"
  | "users.disable"
  | "users.assignTenant"
  | "users.view"
  // tenants / masters (admin only)
  | "tenants.manage"
  | "masters.manage"
  // surveys
  | "surveys.viewAll"
  | "surveys.viewAssigned"
  | "surveys.viewOwn"
  | "surveys.editDraft"
  | "surveys.submit"
  | "surveys.uploadPhotos"
  | "surveys.delete"
  // qc
  | "qc.review"
  | "qc.decide" // approve / reject
  | "qc.requestCorrection" // add remark
  | "qc.reopen" // override an approved decision
  // analytics / audit / reports
  | "analytics.view"
  | "audit.view"
  | "reports.export";

const MATRIX: Record<Role, Capability[]> = {
  pending: [],

  surveyor: ["surveys.viewOwn", "surveys.editDraft", "surveys.submit", "surveys.uploadPhotos", "surveys.delete"],

  supervisor: [
    "surveys.viewAssigned",
    "qc.review",
    "qc.decide",
    "qc.requestCorrection",
    "qc.reopen",
    "analytics.view",
    "users.view",
    "reports.export",
  ],

  admin: [
    "users.approve",
    "users.disable",
    "users.assignTenant",
    "users.view",
    "tenants.manage",
    "masters.manage",
    "surveys.viewAll",
    "surveys.editDraft",
    "surveys.submit",
    "surveys.uploadPhotos",
    "surveys.delete",
    "qc.review",
    "qc.decide",
    "qc.requestCorrection",
    "qc.reopen",
    "analytics.view",
    "audit.view",
    "reports.export",
  ],
};

export function can(role: Role | undefined, capability: Capability): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(capability) ?? false;
}

export function canAny(role: Role | undefined, capabilities: Capability[]): boolean {
  return capabilities.some((c) => can(role, c));
}

/** Which nav sections a role may see. Keep in sync with components/layout/sidebar. */
export const NAV_VISIBILITY: Record<Role, string[]> = {
  pending: [],
  surveyor: ["dashboard", "surveys", "settings"],
  supervisor: ["dashboard", "surveys", "qc", "users", "reports", "settings"],
  admin: ["dashboard", "surveys", "qc", "users", "masters", "reports", "audit", "settings"],
};
