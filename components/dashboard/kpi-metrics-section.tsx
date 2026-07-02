"use client";

import { SectionHeader } from "@/components/design-system/executive-hero";
import { MetricCard } from "@/components/design-system/metric-card";
import { StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { CardsSkeleton } from "@/components/shared/loading";
import type { DashboardCounts } from "@/schema/analytics";
import { CalendarDays, CheckCircle2, ClipboardList, Clock3, FileEdit } from "lucide-react";

export function KpiMetricsSection({ counts }: { counts: DashboardCounts | undefined }) {
  return (
    <section aria-labelledby="kpi-heading">
      <SectionHeader title="KPI Metrics" description="Most important survey pipeline indicators" className="mb-4" />
      {counts === undefined ? (
        <CardsSkeleton count={5} />
      ) : (
        <StaggerGrid className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <StaggerItem>
            <MetricCard label="Total Survey" value={counts.total} icon={ClipboardList} tone="default" />
          </StaggerItem>
          <StaggerItem>
            <MetricCard label="Draft" value={counts.drafts} icon={FileEdit} tone="muted" hint="Not yet submitted" />
          </StaggerItem>
          <StaggerItem>
            <MetricCard label="Pending QC" value={counts.pending} icon={Clock3} tone="warning" hint="Awaiting review" />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Created Today"
              value={counts.today}
              hint={`${(counts.submittedToday ?? 0).toLocaleString()} submitted today`}
              icon={CalendarDays}
              tone="info"
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Approved QC"
              value={counts.approved}
              icon={CheckCircle2}
              tone="success"
              hint="QC passed"
            />
          </StaggerItem>
        </StaggerGrid>
      )}
    </section>
  );
}
