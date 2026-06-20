import {
  MAX_SURVEY_OWNERS,
  RESPONDENT_RELATIONSHIP_VALUES,
  SANITATION_TYPE_VALUES,
  WATER_SOURCE_VALUES,
} from "@/lib/domain";
import { z } from "zod";

const indianMobile = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile (starts 6-9)");

const ownerEntry = z.object({
  name: z.string().trim().optional(),
  fatherOrHusbandName: z.string().trim().optional(),
  mobileNo: z.union([indianMobile, z.literal("")]).optional(),
  altMobileNo: z.union([indianMobile, z.literal("")]).optional(),
});

const currentYear = new Date().getFullYear();

/** Full submit-grade schema (matches mode='submit' on the server). */
const surveySubmitBaseSchema = z.object({
  localId: z.string().min(1),
  municipalityId: z.string().min(1, "Select a ULB"),
  wardNo: z.string().min(1, "Ward is required"),

  // Section 1 — Property
  sectorNo: z.string().trim().optional(),
  oldPropertyNo: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  parcelNo: z.string().trim().min(1, "Parcel number is required"),
  unitNo: z.string().trim().min(1, "Unit number is required"),
  constructedYear: z
    .number()
    .int()
    .min(1800, `Enter a year between 1800 and ${currentYear}`)
    .max(currentYear, `Enter a year between 1800 and ${currentYear}`)
    .optional(),
  isSlum: z.boolean(),

  // Section 2 — Owner
  respondentName: z.string().trim().optional(),
  relationship: z.enum(RESPONDENT_RELATIONSHIP_VALUES).optional(),
  owners: z.array(ownerEntry).max(MAX_SURVEY_OWNERS).optional(),
  familySize: z.number().int().min(1, "Family size must be a whole number ≥ 1").optional(),
  mobileNo: indianMobile,
  altMobileNo: z.union([indianMobile, z.literal("")]).optional(),

  // Section 3 — Address
  houseNo: z.string().trim().optional(),
  locality: z.string().trim().min(1, "Locality is required"),
  colonyName: z.string().trim().min(1, "Colony name is required"),
  city: z.string().trim().min(1),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),

  // Section 4 — Taxation
  assessmentYear: z.string().min(1, "Assessment year is required"),
  ownershipType: z.string().min(1, "Ownership type is required"),
  propertyUse: z.string().min(1, "Property use is required"),
  propertyType: z.string().min(1, "Property type is required"),
  situation: z.string().min(1, "Situation is required"),
  roadType: z.string().min(1, "Road type is required"),
  taxRateZone: z.string().min(1, "Tax rate zone is required"),
  plotSqft: z.number().nonnegative(),
  plinthSqft: z.number().nonnegative(),

  // Section 6 — Services
  municipalWaterConnection: z.boolean(),
  waterSource: z.enum(WATER_SOURCE_VALUES),
  sanitationType: z.enum(SANITATION_TYPE_VALUES),
  municipalWasteCollection: z.boolean(),
  electricityNo: z.string().trim().optional(),

  clientUpdatedAt: z.number(),
});

const surveySubmitSchema = surveySubmitBaseSchema.refine((v) => !(v.plinthSqft > v.plotSqft && v.plotSqft > 0), {
  message: "Plinth area cannot exceed plot area",
  path: ["plinthSqft"],
});

export type SurveySubmitValues = z.infer<typeof surveySubmitSchema>;

/** Looser draft schema — only the idempotency + ULB keys are required,
 *  matching the server's `saveDraft` (mode='draft'). */
export const surveyDraftSchema = surveySubmitBaseSchema.partial().extend({
  localId: z.string().min(1),
  municipalityId: z.string().min(1, "Select a ULB"),
  clientUpdatedAt: z.number(),
});
export type SurveyDraftValues = z.infer<typeof surveyDraftSchema>;

/** Floor row — mirrors validateFloorRow. */
const floorSchema = z.object({
  clientFloorId: z.string().min(1),
  position: z.number().int().nonnegative(),
  floorName: z.string().min(1, "Floor is required"),
  usageFactor: z.string().optional(),
  usageType: z.string().min(1, "Usage type is required"),
  constructionType: z.string().min(1, "Construction type is required"),
  isOccupied: z.boolean(),
  areaSqft: z.number().nonnegative(),
});
export type FloorValues = z.infer<typeof floorSchema>;
