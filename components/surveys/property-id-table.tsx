import { TableCell, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Shared Property ID column for survey-scoped tables (ascending list uses same format). */
export function PropertyIdTableHead({ className }: { className?: string }) {
  return <TableHead className={cn("font-mono text-xs whitespace-nowrap", className)}>Property ID</TableHead>;
}

export function PropertyIdTableCell({ propertyId, className }: { propertyId?: string; className?: string }) {
  return (
    <TableCell className={cn("font-mono text-xs whitespace-nowrap", className)}>{propertyId?.trim() || "—"}</TableCell>
  );
}

export function PropertyIdBanner({ propertyId, className }: { propertyId?: string; className?: string }) {
  const id = propertyId?.trim();
  if (!id) return null;
  return (
    <div
      className={cn("rounded-xl border border-primary/25 bg-white px-4 py-3 shadow-sm dark:bg-slate-900/70", className)}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Property ID</p>
      <p className="font-mono text-lg font-bold tracking-tight text-primary">{id}</p>
    </div>
  );
}
