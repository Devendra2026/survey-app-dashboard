import {
  builtUpSqftFromFloors,
  isOpenLandFloor,
  openLandSqftFromFloors,
  plinthSqftFromFloors,
} from "@/convex/areaMasters";

export { builtUpSqftFromFloors, isOpenLandFloor, openLandSqftFromFloors, plinthSqftFromFloors };

export { formatPropertyId, PROPERTY_ID_PATTERN, propertyUseCode } from "@/convex/propertyId";

/** 1 sq ft = 0.09290304 sq m (standard conversion). */
export const SQFT_TO_SQM = 0.09290304;

export function sqftToSqMeter(sqft: number): number {
  if (!(sqft > 0)) return 0;
  return sqft * SQFT_TO_SQM;
}

export function roundArea(n: number, digits = 2): number {
  if (!(n > 0)) return 0;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Format sq ft for display in area summaries. */
export function formatAreaSqft(sqft: number): string {
  if (sqft <= 0) return "—";
  return `${sqft.toLocaleString("en-IN")} sq ft`;
}

export function formatAreaSqMeter(sqft: number): string {
  const sqm = sqftToSqMeter(sqft);
  if (sqm <= 0) return "—";
  return `${sqm.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 })} sq m`;
}

export type SurveyAreaMetrics = {
  plotSqft: number;
  plotSqMeter: number;
  plinthSqft: number;
  plinthSqMeter: number;
  builtUpSqft: number;
  builtUpSqMeter: number;
};

/** Plot / plinth / built-up totals aligned with mobile (plinth from ground floor when present). */
export function surveyAreaMetrics(survey: {
  plotSqft: number;
  plinthSqft: number;
  floors?: { floorName: string; areaSqft: number }[];
}): SurveyAreaMetrics {
  const floors = survey.floors ?? [];
  const builtUpSqft = builtUpSqftFromFloors(floors);
  const plinthFromFloors = plinthSqftFromFloors(floors);
  const plinthSqft = plinthFromFloors > 0 ? plinthFromFloors : survey.plinthSqft;
  const plotSqft = survey.plotSqft;
  return {
    plotSqft,
    plotSqMeter: roundArea(sqftToSqMeter(plotSqft)),
    plinthSqft,
    plinthSqMeter: roundArea(sqftToSqMeter(plinthSqft)),
    builtUpSqft,
    builtUpSqMeter: roundArea(sqftToSqMeter(builtUpSqft)),
  };
}
