import { cn } from "@/lib/utils";

export function QcActionBarProgress({
  isApproved,
  correctionsSaved,
}: {
  isApproved: boolean;
  correctionsSaved: boolean;
}) {
  return (
    <div className="h-1 w-full bg-muted">
      <div
        className={cn(
          "h-full transition-all duration-500",
          isApproved
            ? "w-full bg-linear-to-r from-emerald-600 to-emerald-500"
            : correctionsSaved
              ? "w-3/4 bg-linear-to-r from-amber-500 to-emerald-500"
              : "w-1/2 bg-linear-to-r from-amber-500 to-amber-400",
        )}
      />
    </div>
  );
}
