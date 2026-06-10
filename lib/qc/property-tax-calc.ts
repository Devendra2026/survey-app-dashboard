import { annualRateToMonthly, DEFAULT_TAX_RATES } from "./tax-rate-defaults";

/** Round to 2 decimal places (paise). */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Gross annual letting value (yearly rate from master data).
 *   Gross ALV = area (sqft) × yearly rate (₹/sqft/year) × usage multiplier
 */
export function computeGrossAlvYearly(areaSqft: number, yearlyRatePerSqft: number, usageMult = 1): number {
  return roundMoney(areaSqft * yearlyRatePerSqft * usageMult);
}

/** Assessable value (yearly): 80% of gross annual ALV. */
export function computeAssessableAlv(
  grossAlv: number,
  assessableValuePct = DEFAULT_TAX_RATES.assessableValuePct,
): number {
  return roundMoney(grossAlv * assessableValuePct);
}

/**
 * Tax component from ALV using "per hundred" rate.
 *   Tax = ALV / 100 × taxPerHundred
 */
export function computeTaxFromAlv(alv: number, taxPct: number): number {
  const taxPerHundred = taxPct * 100;
  return roundMoney((alv / 100) * taxPerHundred);
}

/**
 * Property tax via 80% assessable value rule (yearly assessable).
 * Master `propertyTaxPct` is effective % on gross ALV (e.g. 10%).
 */
export function computePropertyTaxFromGrossAlv(
  grossAlv: number,
  effectiveGrossTaxPct: number,
  assessableValuePct = DEFAULT_TAX_RATES.assessableValuePct,
): { assessableAlv: number; propertyTax: number; taxOnAssessablePct: number } {
  const assessableAlv = computeAssessableAlv(grossAlv, assessableValuePct);
  const taxOnAssessablePct = effectiveGrossTaxPct / assessableValuePct;
  const propertyTax = computeTaxFromAlv(assessableAlv, taxOnAssessablePct);
  return { assessableAlv, propertyTax, taxOnAssessablePct };
}

/**
 * Yearly assessable + Water + Drainage = Total demand (yearly).
 * "Yearly assessable" is property tax on the 80% assessable ALV base.
 * Water and drainage are yearly % of that same assessable ALV.
 */
export function computeTotalAnnualDemand(
  yearlyAssessableAlv: number,
  yearlyAssessableTax: number,
  waterTaxPct: number,
  drainageTaxPct: number,
  includeWater: boolean,
): { waterTax: number; drainageTax: number; totalAnnualDemand: number } {
  const waterTax = includeWater ? computeTaxFromAlv(yearlyAssessableAlv, waterTaxPct) : 0;
  const drainageTax = computeTaxFromAlv(yearlyAssessableAlv, drainageTaxPct);
  const totalAnnualDemand = roundMoney(yearlyAssessableTax + waterTax + drainageTax);
  return { waterTax, drainageTax, totalAnnualDemand };
}

export function computeFloorPropertyTax(
  areaSqft: number,
  yearlyRatePerSqft: number,
  propertyTaxPct: number,
  usageMult = 1,
  assessableValuePct = DEFAULT_TAX_RATES.assessableValuePct,
): { monthlyRate: number; alv: number; assessableAlv: number; tax: number } {
  const alv = computeGrossAlvYearly(areaSqft, yearlyRatePerSqft, usageMult);
  const { assessableAlv, propertyTax } = computePropertyTaxFromGrossAlv(alv, propertyTaxPct, assessableValuePct);
  const monthlyRate = annualRateToMonthly(yearlyRatePerSqft);
  return { monthlyRate, alv, assessableAlv, tax: propertyTax };
}
