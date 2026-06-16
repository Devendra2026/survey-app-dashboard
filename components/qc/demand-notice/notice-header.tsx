"use client";

import type { OfficeTitles } from "@/lib/qc/demand-notice";
import { NoticeLogo } from "./notice-watermark";

export function NoticeHeader({
  office,
  propertyId,
  assessmentYear,
  noticeDate,
  logoUrl,
}: {
  office: OfficeTitles;
  propertyId: string;
  assessmentYear: string;
  noticeDate: string;
  logoUrl?: string | null;
}) {
  return (
    <header className="demand-notice-header dn-section relative z-[1] border-b-2 border-[var(--dn-accent)] bg-white px-[var(--dn-space-4)] py-[var(--dn-space-4)]">
      <div className="dn-grid-12 items-start gap-[var(--dn-space-3)]">
        <div className="demand-notice-header-logo col-span-12 flex justify-center sm:col-span-2 sm:justify-start">
          <NoticeLogo ulbName={office.ulbName} logoUrl={logoUrl} />
        </div>

        <div className="demand-notice-header-title col-span-12 text-center sm:col-span-8 sm:text-left">
          <p className="dn-title demand-notice-hi text-lg font-bold leading-snug text-[var(--dn-primary)] print:text-[11px] print:leading-tight">
            {office.hindi}
          </p>
          <p className="dn-title mt-0.5 text-base font-semibold text-[var(--dn-primary)]/90 print:text-[9px]">
            {office.english}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--dn-secondary)] print:mt-0.5 print:text-[6px]">
            Property Tax Demand Notice / <span className="demand-notice-hi">संपत्ति कर मांग नोटिस</span>
          </p>
          <div className="demand-notice-header-details mt-2 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--dn-secondary)] sm:justify-start">
            <span>
              <span className="opacity-70">ULB:</span>{" "}
              <strong className="text-[var(--dn-primary)]">{office.ulbName}</strong>
            </span>
            <span>
              <span className="opacity-70">District:</span>{" "}
              <strong className="text-[var(--dn-primary)]">{office.districtName}</strong>
            </span>
            <span>
              <span className="opacity-70">State:</span>{" "}
              <strong className="text-[var(--dn-primary)]">{office.stateName}</strong>
            </span>
          </div>
        </div>

        <div className="demand-notice-header-meta col-span-12 rounded-md border border-[var(--dn-border)] bg-[var(--dn-surface)] p-3 text-xs sm:col-span-2">
          <dl className="space-y-1.5">
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
                Assessment Year
              </dt>
              <dd className="font-bold text-[var(--dn-primary)]">{assessmentYear}</dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
                Notice Date
              </dt>
              <dd className="font-bold text-[var(--dn-primary)]">{noticeDate}</dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
                Property ID
              </dt>
              <dd className="font-mono text-[11px] font-bold text-[var(--dn-accent)] print:text-[7px]">{propertyId}</dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  );
}
