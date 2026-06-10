import type { MasterOption } from "@/convex/areaMasters";
import {
  annualRateToMonthly,
  DEFAULT_RATE_MATRIX,
  DEFAULT_TAX_RATES,
  DEFAULT_USAGE_MULTIPLIERS,
  TAX_RATE_ZONE_ROWS,
} from "@/lib/qc/tax-rate-defaults";
import {
  hasWardCustomRates,
  resolveAnnualRate,
  resolveConstructionTypeKey,
  resolveTaxRateZoneKey,
} from "@/lib/qc/tax-rate-matrix";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import type { FloorRow, SurveyDetail } from "@/schema/surveys/index";
import { formatInr } from "./demand-estimate";
import { computeFloorPropertyTax, computeTotalAnnualDemand } from "./property-tax-calc";

export type FloorAssessmentRow = {
  floorLabel: string;
  usageLabel: string;
  constructionLabel: string;
  areaSqft: number;
  monthlyRate: number;
  baseRate: number;
  roadFactor: number;
  usageMult: number;
  alv: number;
  assessableAlv: number;
  tax: number;
};

/** Annual rate resolved from ward matrix + road-width zone + construction (master data). */
export type MasterBaseRate = {
  wardNo: string;
  zoneKey: string;
  zoneLabel: string;
  constructionKey: string;
  constructionLabel: string;
  monthlyRate: number;
  annualRate: number;
};

export type DemandNoticeData = {
  floorRows: FloorAssessmentRow[];
  masterBaseRate: MasterBaseRate | null;
  roadTypeFactor: number;
  rateSource: "ward" | "ulb" | "system";
  totalArea: number;
  totalAlv: number;
  totalAssessableAlv: number;
  assessableValuePct: number;
  totalTax: number;
  propertyTax: number;
  waterTax: number;
  drainageTax: number;
  totalAnnualDemand: number;
};

/** Dynamic rate config from the taxRates table; null means use system defaults. */
export type TaxRateConfig = {
  rateMatrix: Record<string, Record<string, number>>;
  wardRates?: Record<string, Record<string, Record<string, number>>>;
  propertyTaxPct: number;
  waterTaxPct: number;
  drainageTaxPct: number;
  usageMultipliers: Record<string, number>;
} | null;

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
    taxRateZones?: MasterOption[];
  },
  rateConfig?: TaxRateConfig,
): DemandNoticeData {
  const fallbackMatrix = rateConfig?.rateMatrix ?? DEFAULT_RATE_MATRIX;
  const usesWardRates = hasWardCustomRates(survey.wardNo, rateConfig?.wardRates);
  const rateSource: DemandNoticeData["rateSource"] = usesWardRates ? "ward" : rateConfig ? "ulb" : "system";

  const multipliers = rateConfig?.usageMultipliers ?? DEFAULT_USAGE_MULTIPLIERS;
  const assessableValuePct = DEFAULT_TAX_RATES.assessableValuePct;
  const propertyTaxRate = rateConfig?.propertyTaxPct ?? DEFAULT_TAX_RATES.propertyTaxPct;
  const waterTaxRate = rateConfig?.waterTaxPct ?? DEFAULT_TAX_RATES.waterTaxPct;
  const drainageTaxRate = rateConfig?.drainageTaxPct ?? DEFAULT_TAX_RATES.drainageTaxPct;

  const primaryFloor = floors[0];
  const primaryConstruction = primaryFloor?.constructionType ?? "pakka_rcc_rb";
  const zoneKey = resolveTaxRateZoneKey(survey.taxRateZone);
  const constructionKey = resolveConstructionTypeKey(primaryConstruction);
  const annualBaseRate = resolveAnnualRate(
    survey.wardNo,
    survey.taxRateZone,
    primaryConstruction,
    rateConfig?.wardRates,
    fallbackMatrix,
  );
  const zoneLabel =
    labelFromOptions(masters?.taxRateZones, survey.taxRateZone) ??
    TAX_RATE_ZONE_ROWS.find((z) => z.key === zoneKey)?.label ??
    zoneKey;
  const constructionLabel =
    labelFromOptions(masters?.constructionTypes, primaryConstruction) ??
    labelFromOptions(masters?.constructionTypes, constructionKey) ??
    constructionKey;

  const masterBaseRate: MasterBaseRate | null =
    floors.length > 0
      ? {
          wardNo: survey.wardNo,
          zoneKey,
          zoneLabel,
          constructionKey,
          constructionLabel,
          monthlyRate: annualRateToMonthly(annualBaseRate),
          annualRate: annualBaseRate,
        }
      : null;

  const floorRows: FloorAssessmentRow[] = floors.map((floor) => {
    const area = floor.areaSqft ?? 0;
    const baseRate = resolveAnnualRate(
      survey.wardNo,
      survey.taxRateZone,
      floor.constructionType,
      rateConfig?.wardRates,
      fallbackMatrix,
    );
    const usageMult = resolveUsageMult(floor.usageFactor ?? "", floor.usageType, multipliers, survey.propertyUse);
    const { monthlyRate, alv, assessableAlv, tax } = computeFloorPropertyTax(
      area,
      baseRate,
      propertyTaxRate,
      usageMult,
      assessableValuePct,
    );
    return {
      floorLabel: labelFromOptions(masters?.floors, floor.floorName),
      usageLabel:
        labelFromOptions(masters?.usageTypes, floor.usageType) ||
        labelFromOptions(masters?.usageFactors, floor.usageFactor),
      constructionLabel: labelFromOptions(masters?.constructionTypes, floor.constructionType),
      areaSqft: area,
      monthlyRate,
      baseRate,
      roadFactor: 1,
      usageMult,
      alv,
      assessableAlv,
      tax,
    };
  });

  const totalArea = floorRows.reduce((s, r) => s + r.areaSqft, 0);
  const totalAlv = floorRows.reduce((s, r) => s + r.alv, 0);
  const totalAssessableAlv = floorRows.reduce((s, r) => s + r.assessableAlv, 0);
  const totalTax = floorRows.reduce((s, r) => s + r.tax, 0);
  const propertyTax = totalTax;
  const { waterTax, drainageTax, totalAnnualDemand } = computeTotalAnnualDemand(
    totalAssessableAlv,
    propertyTax,
    waterTaxRate,
    drainageTaxRate,
    Boolean(survey.municipalWaterConnection),
  );

  return {
    floorRows,
    masterBaseRate,
    roadTypeFactor: 1,
    rateSource,
    totalArea,
    totalAlv,
    totalAssessableAlv,
    assessableValuePct,
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
