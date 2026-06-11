"use client";

import { PageTransition } from "@/components/design-system/motion";
import { QcCommandHero, QcFiltersSection, QcMetricsSection, QcWardSection } from "@/components/qc/qc-queue-sections";
import { RoleGate } from "@/components/shared/role-gate";
import { useQcQueue } from "@/hooks/qc/useQcQueue";

export default function QcCommandCenterPage() {
  const { isLoading, stats, wardStats, filters, handleFiltersChange } = useQcQueue();

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control is available to QC supervisors and administrators."
    >
      <PageTransition className="space-y-6 lg:space-y-8">
        <QcCommandHero />
        <QcFiltersSection filters={filters} onChange={handleFiltersChange} />
        <QcMetricsSection stats={stats} isLoading={isLoading} />
        <QcWardSection wardStats={wardStats} isLoading={isLoading} />
      </PageTransition>
    </RoleGate>
  );
}
