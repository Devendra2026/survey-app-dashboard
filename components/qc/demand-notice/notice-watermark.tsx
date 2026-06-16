"use client";

import { ulbInitials } from "./shared";

export function NoticeWatermark({ ulbName }: { ulbName: string }) {
  return (
    <div className="demand-notice-watermark pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="demand-notice-watermark-text demand-notice-hi">{ulbName}</div>
    </div>
  );
}

export function NoticeLogo({ ulbName, logoUrl }: { ulbName: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className="h-14 w-14 object-contain print:h-8 print:w-8" />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--dn-accent)] bg-[var(--dn-surface)] print:h-8 print:w-8 print:border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/municipal-emblem.svg" alt="" className="h-10 w-10 print:h-6 print:w-6" />
      <span className="sr-only">{ulbInitials(ulbName)}</span>
    </div>
  );
}
