"use client";

import { SectionHeader } from "@/components/design-system/executive-hero";
import { MetricCard } from "@/components/design-system/metric-card";
import { CardsSkeleton } from "@/components/shared/loading";
import type { StatsBreakdown } from "@/schema/analytics";
import { Building2, MapPin, ShieldCheck, Users } from "lucide-react";

export function OrganizationSection({ breakdown }: { breakdown: StatsBreakdown | undefined }) {
  return (
    <section aria-labelledby="org-heading">
      <SectionHeader title="Organization" description="Teams and geographic scope" className="mb-4" />
      {breakdown === undefined ? (
        <CardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            label="Active Surveyors"
            value={breakdown.filterOptions?.surveyors?.length ?? 0}
            icon={Users}
            tone="default"
          />
          <MetricCard
            label="Active QC Supervisor"
            value={breakdown.filterOptions?.qcSupervisors?.length ?? 0}
            icon={ShieldCheck}
            tone="warning"
          />
          <MetricCard
            label="District"
            value={breakdown.filterOptions?.districts?.length ?? 0}
            icon={MapPin}
            tone="info"
          />
          <MetricCard
            label="Municipalities"
            value={breakdown.filterOptions?.municipalities?.length ?? 0}
            icon={Building2}
            tone="info"
          />
        </div>
      )}
    </section>
  );
}
