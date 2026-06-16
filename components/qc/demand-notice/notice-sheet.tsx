"use client";

import type { ReactNode } from "react";

export function DemandNoticeSheet({ children, floorCount }: { children: ReactNode; floorCount?: number }) {
  const densityClass = floorCount !== undefined && floorCount >= 4 ? "dn-floors-many" : undefined;

  return (
    <article
      className={`demand-notice-document demand-notice-sheet a4-page relative mx-auto w-full max-w-[var(--dn-page-w,210mm)] overflow-hidden rounded-2xl border border-[var(--dn-border)] bg-white shadow-premium-lg print:max-w-[var(--dn-content-w,194mm)] print:rounded-none print:border-0 print:shadow-none${densityClass ? ` ${densityClass}` : ""}`}
      data-floors={floorCount}
    >
      <div className="demand-notice-print-viewport">
        <div className="demand-notice-print-scaler">{children}</div>
      </div>
    </article>
  );
}

export function DemandNoticeBody({ children }: { children: ReactNode }) {
  return (
    <div className="demand-notice-sheet-body relative z-[1] space-y-[var(--dn-space-4,16px)] bg-white p-[var(--dn-space-4,16px)] sm:p-[var(--dn-space-5,24px)]">
      {children}
    </div>
  );
}
