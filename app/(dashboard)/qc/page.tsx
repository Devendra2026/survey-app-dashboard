"use client";

import { PageTransition } from "@/components/design-system/motion";
import { QcCommandHero, QcFiltersSection, QcMetricsSection, QcWardSection } from "@/components/qc/qc-queue-sections";
import { RoleGate } from "@/components/shared/role-gate";
import { useQcQueue } from "@/hooks/qc/useQcQueue";

export default function QcCommandCenterPage() {
  const { isLoading, stats, wardStats, scope, dateFilters, handleScopeChange, handleDateFiltersChange } = useQcQueue();

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
        <QcMetricsSection stats={stats} isLoading={isLoading} />
        <QcWardSection wardStats={wardStats} isLoading={isLoading} />
      </PageTransition>
    </RoleGate>
  );
}
