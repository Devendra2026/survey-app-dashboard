"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import type { TaxRateConfig } from "@/lib/qc/demand-notice";
import { useQuery as useConvexQuery } from "convex/react";

/** Ward/ULB tax rates for demand notice — wraps Convex useQuery for reactive loading. */
export function useTaxRatesForMunicipality(municipalityId: Id<"municipalities"> | undefined) {
  const ready = useConvexAuthReady();
  const data = useConvexQuery(api.taxRates.getForMunicipality, ready && municipalityId ? { municipalityId } : "skip");

  return {
    rateConfig: data as TaxRateConfig | undefined,
    ratesLoading: data === undefined,
    propertyTaxPct: data?.propertyTaxPct,
  };
}
