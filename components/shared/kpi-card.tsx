import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "muted";
}) {
  const ring = {
    default: "before:bg-primary",
    success: "before:bg-success",
    warning: "before:bg-warning",
    destructive: "before:bg-destructive",
    muted: "before:bg-muted-foreground",
  }[tone];
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5 before:absolute before:left-0 before:top-0 before:h-full before:w-1",
        ring,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
