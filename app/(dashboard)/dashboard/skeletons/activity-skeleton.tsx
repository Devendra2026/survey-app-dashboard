export function ActivitySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading activity">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}
