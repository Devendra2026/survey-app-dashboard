/**
 * domain.ts — the canonical dropdown options, enums and status maps used by
 * the web forms and tables.
 *
 * CRITICAL: these are RE-EXPORTED from the shared backend modules under
 * `@convex/*`, never hand-redefined. The mobile app and the Convex validators
 * import the same constants, so a value that renders in a <Select> here is
 * guaranteed to pass `validateTaxationSection` / `validateServicesSection` /
 * `validateFloorRow` on the server. If a category is ever edited in the
 * backend, this file picks it up with zero drift.
 *
 * At runtime the live, admin-editable option sets come from `masters.bundle`
 * (use the `useMasters()` hook). These static exports are the typed fallback /
 * the source for zod enums where the backend treats the field as a closed set.
 */

export {
  OWNERSHIP_TYPES,
  PROPERTY_USES,
  PROPERTY_USES_REQUIRING_SUBCATEGORY,
  PROPERTY_USE_SUBCATEGORIES,
  ROAD_TYPES,
  SITUATIONS,
  TAX_RATE_ZONES,
} from "@/convex/taxationMasters";

export { SANITATION_TYPES, SANITATION_TYPE_VALUES, WATER_SOURCES, WATER_SOURCE_VALUES } from "@/convex/serviceMasters";

export { CONSTRUCTION_TYPES, FLOOR_NAMES, FLOOR_USAGE_FACTORS, FLOOR_USAGE_TYPES } from "@/convex/areaMasters";

export { MAX_SURVEY_OWNERS, RESPONDENT_RELATIONSHIPS, RESPONDENT_RELATIONSHIP_VALUES } from "@/convex/ownerConstants";

export {
  GPS_ACCEPT_MAX_ACCURACY_METERS,
  GPS_EXCELLENT_ACCURACY_METERS,
  GPS_TARGET_ACCURACY_METERS,
} from "@/convex/gpsAccuracy";

/* ── Status vocabularies (mirror schema.ts unions exactly) ─────────────────── */

export const SURVEY_STATUSES = ["draft", "submitted", "approved", "rejected"] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const QC_STATUSES = ["pending", "approved", "rejected"] as const;
export type QcStatus = (typeof QC_STATUSES)[number];

export const PHOTO_SLOTS = ["front", "inside", "side", "document"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export const USER_ROLES = ["pending", "surveyor", "supervisor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["pending_approval", "active", "disabled"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  pending: "Pending",
  surveyor: "Surveyor",
  supervisor: "Supervisor",
  admin: "Administrator",
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  pending_approval: "Pending approval",
  active: "Active",
  disabled: "Disabled",
};

/** Master categories editable from the Masters module (brief list). */
export const MASTER_CATEGORIES = [
  "assessment_year",
  "ownership_type",
  "property_use_subcategory",
  "property_use",
  "situation",
  "road_type",
  "tax_rate_zone",
] as const;
export type MasterCategory = (typeof MASTER_CATEGORIES)[number];

export const MASTER_CATEGORY_LABELS: Record<MasterCategory, string> = {
  assessment_year: "Assessment Year",
  ownership_type: "Ownership Type",
  property_use_subcategory: "Property Type",
  property_use: "Property Use",
  situation: "Situation",
  road_type: "Road Type",
  tax_rate_zone: "Tax Rate Zone",
};

/* ── Display helpers for the two status axes ──────────────────────────────── */

export const SURVEY_STATUS_LABEL: Record<SurveyStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export const QC_STATUS_LABEL: Record<QcStatus, string> = {
  pending: "Pending QC",
  approved: "Approved",
  rejected: "Rejected",
};

/**
 * Tone token for status badges. NOTE the real backend nuance: a *rejected* QC
 * decision sends `survey.status` back to `draft` (so the surveyor can fix &
 * resubmit) while `qcStatus` becomes `rejected`. The UI should therefore key
 * the "rejected" visual off `qcStatus`, not `status`.
 */
export const QC_STATUS_TONE: Record<QcStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export const SURVEY_STATUS_TONE: Record<SurveyStatus, "muted" | "default" | "success" | "destructive"> = {
  draft: "muted",
  submitted: "default",
  approved: "success",
  rejected: "destructive",
};

export const PHOTO_SLOT_LABEL: Record<PhotoSlot, string> = {
  front: "Front",
  inside: "Inside",
  side: "Side",
  document: "Document",
};

/** Matches `survey.submit` — only draft (or legacy rejected status) surveys can be submitted. */
export function canSubmitSurvey(survey: { status: SurveyStatus }): boolean {
  return survey.status === "draft" || survey.status === "rejected";
}

/** QC rejection resets `status` to draft while `qcStatus` stays rejected. */
export function isSurveyResubmit(survey: { status: SurveyStatus; qcStatus: QcStatus }): boolean {
  return survey.status === "draft" && survey.qcStatus === "rejected";
}
