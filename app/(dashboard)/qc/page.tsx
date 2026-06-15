"use client";

import { PageTransition } from "@/components/design-system/motion";
import {
  QcCommandHero,
  QcFiltersSection,
  QcMetricsSection,
  QcPipelineSection,
  QcWardSection,
} from "@/components/qc/qc-queue-sections";
import { RoleGate } from "@/components/shared/role-gate";
import { useQcQueue } from "@/hooks/qc/useQcQueue";

export default function QcCommandCenterPage() {
  const { isLoading, stats, wardStats, rejectedCount, scope, dateFilters, handleScopeChange, handleDateFiltersChange } =
    useQcQueue({
      mode: "command",
    });

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control is available to QC supervisors and administrators."
    >
      <PageTransition className="space-y-6 lg:space-y-8">
        <QcCommandHero />
        <QcFiltersSection
          scope={scope}
          dateFilters={dateFilters}
          onScopeChange={handleScopeChange}
          onDateFiltersChange={handleDateFiltersChange}
        />
        <QcPipelineSection stats={stats} rejectedCount={rejectedCount} isLoading={isLoading} />
        <QcMetricsSection stats={stats} isLoading={isLoading} />
        <QcWardSection wardStats={wardStats} isLoading={isLoading} />
      </PageTransition>
    </RoleGate>
  );
}
