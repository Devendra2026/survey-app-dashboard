"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
      className={`rounded-md border border-(--dn-border) bg-white px-3 py-2.5 print:px-1.5 print:py-0.5 dark:border-primary/15 dark:bg-card/60 ${className ?? ""}`}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-(--dn-secondary) print:text-[6px] print:tracking-wide">
        {Icon && <Icon className="h-3 w-3 shrink-0 opacity-60 print:h-2 print:w-2" aria-hidden />}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-(--dn-primary) print:mt-0 print:text-[8px] print:leading-tight">
        {value}
      </p>
    </div>
  );
}
