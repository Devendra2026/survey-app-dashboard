"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Map } from "lucide-react";

type WardCell = {
  wardNo: string;
  municipalityName?: string;
  total: number;
  approvalRate: number;
};

function heatColor(rate: number, total: number): string {
  if (total === 0) return "bg-muted/60 text-muted-foreground";
  if (rate >= 80) return "bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border-emerald-500/30";
  if (rate >= 50) return "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/30";
  return "bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-500/30";
}

export function CoverageHeatmap({
  data,
  loading,
  className,
}: {
  data?: WardCell[];
  loading?: boolean;
  className?: string;
}) {
  const lowCoverage = data?.filter((w) => w.total > 0 && w.approvalRate < 50).length ?? 0;

  return (
    <GlassCard padding="md" className={className}>
      <GlassCardHeader
        title="Coverage Heatmap"
        description={lowCoverage > 0 ? `${lowCoverage} wards below 50% approval` : "Ward-level approval density"}
        icon={<Map className="h-4 w-4" aria-hidden />}
      />
      {loading ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8" aria-busy="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">No ward coverage data in scope.</p>
      ) : (
        <>
          <figure
            className="m-0 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8"
            aria-label="Ward coverage heatmap showing approval rates by ward"
          >
            {data.slice(0, 32).map((ward) => (
              <div
                key={`${ward.municipalityName}-${ward.wardNo}`}
                title={`Ward ${ward.wardNo}: ${ward.total} surveys, ${ward.approvalRate}% approved`}
                className={cn(
                  "flex aspect-square cursor-default flex-col items-center justify-center rounded-lg border text-center transition-colors duration-200",
                  heatColor(ward.approvalRate, ward.total),
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">W{ward.wardNo}</span>
                <span className="font-mono text-sm font-bold tabular-nums">{ward.total}</span>
                <span className="text-[9px] font-medium opacity-80">{ward.approvalRate}%</span>
              </div>
            ))}
          </figure>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/40" aria-hidden /> ≥80%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/40" aria-hidden /> 50–79%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/40" aria-hidden /> &lt;50%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-muted" aria-hidden /> No data
            </span>
          </div>
        </>
      )}
    </GlassCard>
  );
}
