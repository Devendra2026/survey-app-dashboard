import { MetricCard } from "@/components/design-system/metric-card";

/** @deprecated Prefer MetricCard from design-system */
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
  const mapped = tone === "muted" ? "muted" : tone;
  return <MetricCard label={label} value={value} hint={hint} tone={mapped} />;
}
