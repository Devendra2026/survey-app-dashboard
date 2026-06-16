"use client";

import type { ReactNode } from "react";

export function DemandNoticeSheet({ children, floorCount }: { children: ReactNode; floorCount?: number }) {
  const densityClass = floorCount !== undefined && floorCount >= 4 ? "dn-floors-many" : undefined;

  return (
    <article
      className={`demand-notice-document demand-notice-sheet a4-page relative mx-auto w-full max-w-480 overflow-hidden rounded-2xl border border-(--dn-border) bg-white shadow-premium-lg print:max-w-(--dn-content-w,194mm) print:rounded-none print:border-0 print:shadow-none${densityClass ? ` ${densityClass}` : ""}`}
      data-floors={floorCount}
    >
      <div className="demand-notice-print-viewport">
        <div className="demand-notice-print-scaler">{children}</div>
      </div>
    </article>
  );
}

export function DemandNoticeBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`demand-notice-sheet-body relative z-1 space-y-(--dn-space-4,16px) bg-white p-(--dn-space-4,16px) sm:p-(--dn-space-5,24px) ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
