import type { MasterOption } from "@/convex/areaMasters";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import type { FloorRow, SurveyDetail } from "@/schema/surveys/index";
import { formatInr } from "./demand-estimate";

export type FloorAssessmentRow = {
  floorLabel: string;
  usageLabel: string;
  constructionLabel: string;
  areaSqft: number;
  alv: number;
  tax: number;
};

export type DemandNoticeData = {
  floorRows: FloorAssessmentRow[];
  totalArea: number;
  totalAlv: number;
  totalTax: number;
  propertyTax: number;
  waterTax: number;
  drainageTax: number;
  totalAnnualDemand: number;
};

const ZONE_ALV_PER_SQFT: Record<string, number> = {
  below_9m: 12.44,
  "9_to_12m": 10.5,
  "12_to_24m": 9.0,
  above_24m: 7.5,
  rate_zone_1: 12.44,
  rate_zone_2: 10.5,
  rate_zone_3: 9.0,
  rate_zone_4: 7.5,
  rate_zone_5: 6.5,
};

const USAGE_ALV_MULTIPLIER: Record<string, number> = {
  residential: 1,
  commercial: 1.45,
  mix_property: 1.2,
  open_land: 0.6,
  religious_property: 0.4,
};

const PROPERTY_TAX_RATE = 0.1;
const WATER_TAX_RATE = 0.07;
const DRAINAGE_TAX_RATE = 0.025;

function usageMultiplier(usageType: string, propertyUse?: string): number {
  const key = usageType?.toLowerCase() || propertyUse || "residential";
  if (key.includes("commercial") || key.includes("shop")) return USAGE_ALV_MULTIPLIER.commercial;
  if (key.includes("mix")) return USAGE_ALV_MULTIPLIER.mix_property;
  return USAGE_ALV_MULTIPLIER[key] ?? USAGE_ALV_MULTIPLIER.residential;
}

function alvRateForZone(taxRateZone?: string): number {
  return ZONE_ALV_PER_SQFT[taxRateZone ?? ""] ?? 10;
}

export function buildSurveyAddress(survey: SurveyDetail): string {
  return [survey.houseNo, survey.colonyName, survey.locality, survey.city, survey.pinCode].filter(Boolean).join(", ");
}

export function buildOfficeTitles(cityName: string, stateName: string) {
  return {
    hindi: `कार्यालय नगर पालिका परिषद, ${cityName}, ${stateName}`,
    english: `Office of Nagar Palika Parishad, ${cityName}, ${stateName}`,
  };
}

export function computeDemandNotice(
  survey: SurveyDetail,
  floors: FloorRow[],
  masters?: {
    floors?: MasterOption[];
    usageTypes?: MasterOption[];
    usageFactors?: MasterOption[];
    constructionTypes?: MasterOption[];
  },
): DemandNoticeData {
  const zoneRate = alvRateForZone(survey.taxRateZone);
  const floorRows: FloorAssessmentRow[] = floors.map((floor) => {
    const area = floor.areaSqft ?? 0;
    const multiplier = usageMultiplier(floor.usageType, survey.propertyUse);
    const alv = Math.round(area * zoneRate * multiplier * 100) / 100;
    const tax = Math.round(alv * PROPERTY_TAX_RATE * 100) / 100;
    return {
      floorLabel: labelFromOptions(masters?.floors, floor.floorName),
      usageLabel:
        labelFromOptions(masters?.usageTypes, floor.usageType) ||
        labelFromOptions(masters?.usageFactors, floor.usageFactor),
      constructionLabel: labelFromOptions(masters?.constructionTypes, floor.constructionType),
      areaSqft: area,
      alv,
      tax,
    };
  });

  const totalArea = floorRows.reduce((s, r) => s + r.areaSqft, 0);
  const totalAlv = floorRows.reduce((s, r) => s + r.alv, 0);
  const totalTax = floorRows.reduce((s, r) => s + r.tax, 0);
  const propertyTax = totalTax;
  const waterTax = survey.municipalWaterConnection ? Math.round(totalAlv * WATER_TAX_RATE * 100) / 100 : 0;
  const drainageTax = Math.round(totalAlv * DRAINAGE_TAX_RATE * 100) / 100;
  const totalAnnualDemand = Math.round((propertyTax + waterTax + drainageTax) * 100) / 100;

  return {
    floorRows,
    totalArea,
    totalAlv,
    totalTax,
    propertyTax,
    waterTax,
    drainageTax,
    totalAnnualDemand,
  };
}

export function formatNoticeDate(ms?: number | null): string {
  const date = ms ? new Date(ms) : new Date();
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function formatAmountPlain(amount: number): string {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export { formatInr };
