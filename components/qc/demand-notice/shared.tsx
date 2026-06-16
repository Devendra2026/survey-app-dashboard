"use client";

import type { DemandNoticeData } from "@/lib/qc/demand-notice";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function BilingualLabel({ en, hi }: { en: string; hi: string }) {
  return (
    <span>
      {en}
      <span className="demand-notice-bilingual-sep"> / </span>
      <span className="demand-notice-bilingual-hi demand-notice-hi font-medium text-muted-foreground">{hi}</span>
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="demand-notice-print-hide mb-[var(--dn-space-3,12px)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--dn-secondary)]">
      {children}
    </h2>
  );
}

export function NoticeDataCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: ReactNode;
  value: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md border border-[var(--dn-border)] bg-white px-3 py-2.5 print:px-1.5 print:py-0.5 dark:border-primary/15 dark:bg-card/60 ${className ?? ""}`}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--dn-secondary)] print:text-[6px] print:tracking-wide">
        {Icon && <Icon className="h-3 w-3 shrink-0 opacity-60 print:h-2 print:w-2" aria-hidden />}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--dn-primary)] print:mt-0 print:text-[8px] print:leading-tight">
        {value}
      </p>
    </div>
  );
}

export function pctLabel(val: number): string {
  return `${(val * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export function rateSourceCaption(notice: DemandNoticeData): string {
  const zone = notice.masterBaseRate?.zoneLabel;
  if (notice.rateSource === "ward") {
    return zone
      ? `Ward ${notice.masterBaseRate!.wardNo} · ${zone} · ward master data`
      : `Ward ${notice.masterBaseRate?.wardNo ?? "—"} · ward master data`;
  }
  if (notice.rateSource === "ulb") {
    return zone ? `${zone} · ULB master data` : "ULB master data";
  }
  return "System default rates";
}

export function ulbInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ULB";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
}
