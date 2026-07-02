import { CardsSkeleton } from "@/components/shared/loading";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading analytics">
      <CardsSkeleton count={2} />
      <CardsSkeleton count={2} />
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading activity">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

export function ChartCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 p-4 shadow-sm" aria-busy="true" aria-label="Loading chart">
      <Skeleton className="mb-3 h-5 w-48 rounded-lg" />
      <Skeleton className="h-[288px] w-full rounded-lg" />
    </div>
  );
}
