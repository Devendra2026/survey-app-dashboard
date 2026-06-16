"use client";

import Image from "next/image";

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
      <Image
        src={logoUrl}
        alt=""
        width={56}
        height={56}
        unoptimized
        className="h-14 w-14 object-contain print:h-8 print:w-8"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--dn-accent)] bg-[var(--dn-surface)] print:h-8 print:w-8 print:border">
      <Image src="/municipal-emblem.svg" alt="" width={40} height={40} className="h-10 w-10 print:h-6 print:w-6" />
      <span className="sr-only">{ulbInitials(ulbName)}</span>
    </div>
  );
}
