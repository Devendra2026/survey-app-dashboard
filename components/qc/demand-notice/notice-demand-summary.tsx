"use client";

import { formatInr, type DemandNoticeData } from "@/lib/qc/demand-notice";
import { BilingualLabel, SectionLabel } from "./shared";

export function NoticeDemandSummary({
  notice,
  propPct,
  waterPct,
  drainPct,
}: {
  notice: DemandNoticeData;
  propPct: string;
  waterPct: string;
  drainPct: string;
}) {
  return (
    <section className="dn-section demand-notice-summary-panel">
      <div className="demand-notice-summary-box rounded-xl border border-[var(--dn-accent)]/20 bg-[var(--dn-summary-bg)] p-[var(--dn-space-4)]">
        <SectionLabel>
          <BilingualLabel en="Demand Summary" hi="मांग सारांश" />
        </SectionLabel>
        <div className="demand-notice-summary-grid grid gap-[var(--dn-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white/80 px-3 py-2.5 print:px-1.5 print:py-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
              <BilingualLabel en={`Property Tax (${propPct})`} hi={`संपत्ति कर (${propPct})`} />
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--dn-primary)] print:mt-0 print:text-[8px]">
              {formatInr(notice.propertyTax)}
            </p>
          </div>
          <div className="rounded-lg bg-white/80 px-3 py-2.5 print:px-1.5 print:py-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
              <BilingualLabel en={`Water (${waterPct})`} hi={`जल कर (${waterPct})`} />
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--dn-primary)] print:mt-0 print:text-[8px]">
              {notice.waterTax > 0 ? formatInr(notice.waterTax) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-white/80 px-3 py-2.5 print:px-1.5 print:py-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
              <BilingualLabel en={`Drainage (${drainPct})`} hi={`नाली कर (${drainPct})`} />
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--dn-primary)] print:mt-0 print:text-[8px]">
              {formatInr(notice.drainageTax)}
            </p>
          </div>
          <div className="rounded-lg border-2 border-[var(--dn-accent)] bg-white px-3 py-2.5 sm:col-span-2 lg:col-span-1 print:col-span-1 print:px-1.5 print:py-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
              <BilingualLabel en="Total Annual Demand" hi="कुल वार्षिक मांग" />
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--dn-accent)] print:mt-0 print:text-[10px]">
              {notice.totalAnnualDemand > 0 ? formatInr(notice.totalAnnualDemand) : "—"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
