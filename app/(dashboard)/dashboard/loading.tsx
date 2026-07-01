import { CardsSkeleton } from "@/components/shared/loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
      </div>
      <CardsSkeleton count={5} />
      <CardsSkeleton count={2} />
    </div>
  );
}
