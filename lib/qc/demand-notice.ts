import type { MasterOption } from "@/convex/areaMasters";
import {
  DEFAULT_RATE_MATRIX,
  DEFAULT_ROAD_TYPE_FACTORS,
  DEFAULT_TAX_RATES,
  DEFAULT_USAGE_MULTIPLIERS,
  FALLBACK_RATE,
} from "@/lib/qc/tax-rate-defaults";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import type { FloorRow, SurveyDetail } from "@/schema/surveys/index";
import { formatInr } from "./demand-estimate";

export type FloorAssessmentRow = {
  floorLabel: string;
  usageLabel: string;
  constructionLabel: string;
  areaSqft: number;
  baseRate: number;
  roadFactor: number;
  usageMult: number;
  alv: number;
  tax: number;
};

export type DemandNoticeData = {
  floorRows: FloorAssessmentRow[];
  roadTypeFactor: number;
  totalArea: number;
  totalAlv: number;
  totalTax: number;
  propertyTax: number;
  waterTax: number;
  drainageTax: number;
  totalAnnualDemand: number;
};

/** Dynamic rate config from the taxRates table; null means use system defaults. */
export type TaxRateConfig = {
  rateMatrix: Record<string, Record<string, number>>;
  roadTypeFactors: Record<string, number>;
  propertyTaxPct: number;
  waterTaxPct: number;
  drainageTaxPct: number;
  usageMultipliers: Record<string, number>;
} | null;

function resolveBaseRate(
  zone: string | undefined,
  constructionType: string,
  matrix: Record<string, Record<string, number>>,
): number {
  const zoneRow = matrix[zone ?? ""] ?? matrix["below_9m"] ?? {};
  return zoneRow[constructionType] ?? zoneRow["pakka_rcc_rb"] ?? FALLBACK_RATE;
}

function resolveRoadFactor(roadType: string | undefined, factors: Record<string, number>): number {
  return factors[roadType ?? ""] ?? factors["rcc"] ?? 1.0;
}

function resolveUsageMult(
  usageFactor: string,
  usageType: string,
  multipliers: Record<string, number>,
  propertyUse?: string,
): number {
  const key = usageFactor || usageType?.toLowerCase() || propertyUse || "residential";
  if (key.includes("commercial") || key.includes("shop")) return multipliers.commercial ?? 1.45;
  if (key.includes("mix")) return multipliers.mix ?? multipliers.mix_property ?? 1.2;
  if (key.includes("open_land") || key.includes("agriculture")) return multipliers.open_land ?? 0.6;
  if (key.includes("godown")) return multipliers.godown ?? 1.1;
  return multipliers[key] ?? multipliers.residential ?? 1.0;
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
  rateConfig?: TaxRateConfig,
): DemandNoticeData {
  const matrix = rateConfig?.rateMatrix ?? DEFAULT_RATE_MATRIX;
  const roadFactors = rateConfig?.roadTypeFactors ?? DEFAULT_ROAD_TYPE_FACTORS;
  const multipliers = rateConfig?.usageMultipliers ?? DEFAULT_USAGE_MULTIPLIERS;
  const propertyTaxRate = rateConfig?.propertyTaxPct ?? DEFAULT_TAX_RATES.propertyTaxPct;
  const waterTaxRate = rateConfig?.waterTaxPct ?? DEFAULT_TAX_RATES.waterTaxPct;
  const drainageTaxRate = rateConfig?.drainageTaxPct ?? DEFAULT_TAX_RATES.drainageTaxPct;

  const roadTypeFactor = resolveRoadFactor(survey.roadType, roadFactors);

  const floorRows: FloorAssessmentRow[] = floors.map((floor) => {
    const area = floor.areaSqft ?? 0;
    const baseRate = resolveBaseRate(survey.taxRateZone, floor.constructionType, matrix);
    const usageMult = resolveUsageMult(floor.usageFactor ?? "", floor.usageType, multipliers, survey.propertyUse);
    const alv = Math.round(area * baseRate * roadTypeFactor * usageMult * 100) / 100;
    const tax = Math.round(alv * propertyTaxRate * 100) / 100;
    return {
      floorLabel: labelFromOptions(masters?.floors, floor.floorName),
      usageLabel:
        labelFromOptions(masters?.usageTypes, floor.usageType) ||
        labelFromOptions(masters?.usageFactors, floor.usageFactor),
      constructionLabel: labelFromOptions(masters?.constructionTypes, floor.constructionType),
      areaSqft: area,
      baseRate,
      roadFactor: roadTypeFactor,
      usageMult,
      alv,
      tax,
    };
  });

  const totalArea = floorRows.reduce((s, r) => s + r.areaSqft, 0);
  const totalAlv = floorRows.reduce((s, r) => s + r.alv, 0);
  const totalTax = floorRows.reduce((s, r) => s + r.tax, 0);
  const propertyTax = totalTax;
  const waterTax = survey.municipalWaterConnection ? Math.round(totalAlv * waterTaxRate * 100) / 100 : 0;
  const drainageTax = Math.round(totalAlv * drainageTaxRate * 100) / 100;
  const totalAnnualDemand = Math.round((propertyTax + waterTax + drainageTax) * 100) / 100;

  return {
    floorRows,
    roadTypeFactor,
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
