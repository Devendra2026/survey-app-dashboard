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
  PROPERTY_USE_SUBCATEGORIES,
  PROPERTY_USES_REQUIRING_SUBCATEGORY,
  ROAD_TYPES,
  TAX_RATE_ZONES,
  SITUATIONS,
} from "@/convex/taxationMasters";

export { WATER_SOURCES, SANITATION_TYPES, WATER_SOURCE_VALUES, SANITATION_TYPE_VALUES } from "@/convex/serviceMasters";

export { FLOOR_NAMES, FLOOR_USAGE_FACTORS, FLOOR_USAGE_TYPES, CONSTRUCTION_TYPES } from "@/convex/areaMasters";

export { RESPONDENT_RELATIONSHIPS, RESPONDENT_RELATIONSHIP_VALUES, MAX_SURVEY_OWNERS } from "@/convex/ownerRules";

export {
  GPS_TARGET_ACCURACY_METERS,
  GPS_ACCEPT_MAX_ACCURACY_METERS,
  GPS_EXCELLENT_ACCURACY_METERS,
} from "@/convex/gpsAccuracy";

/* ── Status vocabularies (mirror schema.ts unions exactly) ─────────────────── */

export const SURVEY_STATUSES = ["draft", "submitted", "approved", "rejected"] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const QC_STATUSES = ["pending", "approved", "rejected"] as const;
export type QcStatus = (typeof QC_STATUSES)[number];

export const PHOTO_SLOTS = ["front", "inside", "side", "document"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export const USER_ROLES = ["pending", "surveyor", "supervisor", "admin"] as const;
export const USER_STATUSES = ["pending_approval", "active", "disabled"] as const;

/** Master categories editable from the Masters module (brief list). */
export const MASTER_CATEGORIES = [
  "assessment_year",
  "ownership_type",
  "property_type",
  "property_use",
  "situation",
  "road_type",
  "tax_rate_zone",
] as const;
export type MasterCategory = (typeof MASTER_CATEGORIES)[number];

export const MASTER_CATEGORY_LABELS: Record<MasterCategory, string> = {
  assessment_year: "Assessment Year",
  ownership_type: "Ownership Type",
  property_type: "Property Type",
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
