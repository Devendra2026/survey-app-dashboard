import { CardsSkeleton } from "@/components/shared/loading";

export function ChartsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading analytics">
      <CardsSkeleton count={2} />
      <CardsSkeleton count={2} />
    </div>
  );
}
