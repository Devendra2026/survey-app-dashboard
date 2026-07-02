import { Skeleton } from "@/components/ui/skeleton";

export function ChartCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 p-4 shadow-sm" aria-busy="true" aria-label="Loading chart">
      <Skeleton className="mb-3 h-5 w-48 rounded-lg" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}
