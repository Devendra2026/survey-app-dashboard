"use client";

import { formatInr, type DemandNoticeData } from "@/lib/qc/demand-notice";
import { BilingualLabel, SectionLabel } from "./shared";

export function NoticeDemandSummary({
  notice,
  propPct: _propPct,
  waterPct: _waterPct,
  drainPct: _drainPct,
}: {
  notice: DemandNoticeData;
  propPct: string;
  waterPct: string;
  drainPct: string;
}) {
  const rows = [
    { label: "Property Tax (10%)", value: notice.propertyTax },
    { label: "Water Tax (7.5%)", value: notice.waterTax },
    { label: "Drainage Tax (2.5%)", value: notice.drainageTax },
  ];

  return (
    <section className="dn-section demand-notice-summary-panel rounded-md border border-slate-200 bg-white p-4 print:p-2">
      <SectionLabel>
        <BilingualLabel en="Tax Demand Summary" hi="कर मांग सारांश" />
      </SectionLabel>
      <div className="rounded-lg border border-slate-200 bg-white">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0"
          >
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-slate-800">{formatInr(row.value)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-b-lg border-t-2 border-emerald-400 bg-emerald-50 px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-800">
            <BilingualLabel en="Total Demand Amount" hi="कुल देय मांग राशि" />
          </p>
          <p className="font-mono text-2xl font-extrabold tabular-nums text-emerald-700">
            {notice.totalAnnualDemand > 0 ? formatInr(notice.totalAnnualDemand) : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
