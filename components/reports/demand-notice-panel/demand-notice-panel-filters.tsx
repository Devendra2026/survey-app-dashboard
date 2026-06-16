"use client";

import { SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2 } from "lucide-react";

export function DemandNoticePanelFilters({
  value,
  onChange,
  requiresMunicipality,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  requiresMunicipality: boolean;
}) {
  return (
    <GlassCard padding="md">
      <SectionHeader title="Filter Scope" description="District, ULB, ward, and date range" className="mb-4" />
      <SurveyFilters variant="scope-and-dates" value={value} onChange={onChange} />
      {requiresMunicipality ? (
        <Alert className="mt-4 border-primary/30 bg-primary/5">
          <Building2 className="h-4 w-4" />
          <AlertTitle>Select a ULB</AlertTitle>
          <AlertDescription>
            Demand calculations require a municipality because ward/ULB tax rates are municipality scoped.
          </AlertDescription>
        </Alert>
      ) : null}
    </GlassCard>
  );
}
