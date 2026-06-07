/** Illustrative annual demand breakdown for QC final report display. */
export type DemandLine = { label: string; amount: number };

export type DemandAssessment = {
  lines: DemandLine[];
  total: number;
};

const ZONE_RATE_PER_SQFT: Record<string, number> = {
  rate_zone_1: 3.2,
  rate_zone_2: 2.8,
  rate_zone_3: 2.4,
  rate_zone_4: 2.0,
  rate_zone_5: 1.6,
};

export function estimateDemandAssessment(
  survey: {
    taxRateZone?: string;
    municipalWaterConnection?: boolean;
    sanitationType?: string;
  },
  builtUpSqft: number,
): DemandAssessment {
  if (!(builtUpSqft > 0)) {
    return { lines: [], total: 0 };
  }

  const rate = ZONE_RATE_PER_SQFT[survey.taxRateZone ?? ""] ?? 2.5;
  const propertyTax = Math.round(builtUpSqft * rate);
  const educationCess = Math.round(propertyTax * 0.15);
  const waterFee = survey.municipalWaterConnection ? 1500 : 0;
  const drainage = survey.sanitationType ? 800 : 400;

  return {
    lines: [
      { label: "Property Tax", amount: propertyTax },
      { label: "Education Cess", amount: educationCess },
      { label: "Water Connection Fee", amount: waterFee },
      { label: "Drainage Maintenance", amount: drainage },
    ],
    total: propertyTax + educationCess + waterFee + drainage,
  };
}

export function formatInr(amount: number): string {
  return `₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
