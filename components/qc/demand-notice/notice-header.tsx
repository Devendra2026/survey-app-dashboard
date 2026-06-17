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
  const districtLine = office.districtName && office.districtName !== "—" ? office.districtName : "—";
  const officeLines = ["Office of Town Panchayat", `${office.ulbName},`, `${districtLine}, ${office.stateName},`];

  return (
    <header className="demand-notice-header dn-section relative z-1 rounded-md border border-slate-200 bg-white px-6 py-5 print:rounded-none print:border-black print:px-2 print:py-1.5">
      <div className="demand-notice-header-main grid grid-cols-12 items-start gap-4 print:flex print:items-center print:gap-2">
        <div className="demand-notice-header-logo col-span-12 flex justify-center md:col-span-2 md:justify-start print:shrink-0">
          <NoticeLogo ulbName={office.ulbName} logoUrl={logoUrl} />
        </div>

        <div className="demand-notice-header-title col-span-12 text-center md:col-span-7 print:min-w-0 print:flex-1">
          <h1 className="mt-1 text-xl font-bold leading-tight text-slate-900 print:mt-0 print:text-[10px] print:leading-tight">
            {officeLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4648d4] print:mt-0.5 print:text-[6px]">
            Property Tax Demand Notice
          </p>
          <p className="demand-notice-hi mt-1 text-[12px] font-medium text-slate-700 print:mt-0 print:text-[6px]">
            संपत्ति कर मांग सूचना पत्र
          </p>
        </div>

        <div className="demand-notice-header-meta col-span-12 hidden print:grid md:col-span-3">
          <dl>
            <div>
              <dt>Assessment Year</dt>
              <dd>{assessmentYear}</dd>
            </div>
            <div>
              <dt>Notice Date</dt>
              <dd>{noticeDate}</dd>
            </div>
            <div>
              <dt>Property ID</dt>
              <dd>{propertyId}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="demand-notice-header-details mt-4 grid grid-cols-1 gap-2 border-t border-slate-200 pt-3 sm:grid-cols-3 print:mt-1 print:gap-1 print:border-black print:pt-1">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center sm:text-left print:px-1.5 print:py-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Assessment Year</p>
          <p className="font-mono text-sm font-bold text-slate-900 print:text-[7px]">{assessmentYear}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center sm:text-left print:px-1.5 print:py-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Notice Date</p>
          <p className="font-mono text-sm font-bold text-slate-900 print:text-[7px]">{noticeDate}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center sm:text-left print:px-1.5 print:py-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Property ID</p>
          <p className="font-mono text-sm font-bold text-slate-900 print:text-[7px]">{propertyId}</p>
        </div>
      </div>
    </header>
  );
}
