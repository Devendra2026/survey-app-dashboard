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
  const accent = {
    default: "border-l-primary bg-card",
    success: "border-l-emerald-500 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08]",
    warning: "border-l-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.08]",
    destructive: "border-l-rose-500 bg-rose-500/[0.04] dark:bg-rose-500/[0.08]",
    muted: "border-l-muted-foreground/40 bg-muted/30",
  }[tone];

  return (
    <Card className={cn("border-l-[3px] p-5 shadow-sm transition-shadow hover:shadow-md", accent)}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </Card>
  );
}
