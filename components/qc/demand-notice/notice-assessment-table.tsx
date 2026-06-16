"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAmountPlain, type DemandNoticeData } from "@/lib/qc/demand-notice";
import { BilingualLabel, SectionLabel } from "./shared";

function formatUsageCell(row: DemandNoticeData["floorRows"][number]): string {
  if (row.usageMult !== 1 && row.usageFactorLabel) {
    return `${row.usageTypeLabel} (${row.usageFactorLabel})`;
  }
  return row.usageTypeLabel;
}

export function NoticeAssessmentTable({
  notice,
  propertyTaxPct,
  waterTaxPct,
  drainageTaxPct,
}: {
  notice: DemandNoticeData;
  propertyTaxPct: number;
  waterTaxPct: number;
  drainageTaxPct: number;
}) {
  const effectivePct = (propertyTaxPct * 100).toFixed(1).replace(/\.0$/, "");
  const assessablePct = (notice.assessableValuePct * 100).toFixed(0);
  const taxOnAssessablePct = ((propertyTaxPct / notice.assessableValuePct) * 100).toFixed(1).replace(/\.0$/, "");
  const waterPerHundred = (waterTaxPct * 100).toFixed(1).replace(/\.0$/, "");
  const drainagePerHundred = (drainageTaxPct * 100).toFixed(1).replace(/\.0$/, "");

  return (
    <section className="dn-section demand-notice-table-section">
      <SectionLabel>
        <BilingualLabel en="Assessment Details" hi="मूल्यांकन विवरण" />
      </SectionLabel>
      <div className="overflow-hidden rounded-lg border border-[var(--dn-border)] print:rounded-none">
        <div className="overflow-x-auto">
          <Table className="dn-zebra-table print:text-[7px]">
            <TableHeader>
              <TableRow className="border-b border-[var(--dn-border)] bg-slate-100 hover:bg-slate-100">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[var(--dn-primary)] print:px-1 print:py-0.5 print:text-[6px]">
                  <BilingualLabel en="Floor" hi="तल" />
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[var(--dn-primary)] print:px-1 print:py-0.5 print:text-[6px]">
                  <BilingualLabel en="Usage" hi="उपयोग" />
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[var(--dn-primary)] print:px-1 print:py-0.5 print:text-[6px]">
                  <BilingualLabel en="Construction" hi="निर्माण" />
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-[var(--dn-primary)] print:px-1 print:py-0.5 print:text-[6px]">
                  <BilingualLabel en="Area (SqFt)" hi="क्षेत्रफल" />
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-[var(--dn-primary)] print:px-1 print:py-0.5 print:text-[6px]">
                  <BilingualLabel en="ALV (₹)" hi="वार्षिक मूल्यांकन" />
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-[var(--dn-primary)] print:px-1 print:py-0.5 print:text-[6px]">
                  <BilingualLabel en={`Tax (${effectivePct})`} hi="कर" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notice.floorRows.length > 0 ? (
                notice.floorRows.map((row, i) => (
                  <TableRow
                    key={`${row.floorLabel}-${i}`}
                    className="border-b border-border/40 text-sm even:bg-[var(--dn-zebra)] print:text-[7px]"
                  >
                    <TableCell className="font-semibold print:px-1 print:py-0.5">{row.floorLabel}</TableCell>
                    <TableCell className="text-[var(--dn-secondary)] print:px-1 print:py-0.5">
                      {formatUsageCell(row)}
                    </TableCell>
                    <TableCell className="text-[var(--dn-secondary)] print:px-1 print:py-0.5">
                      {row.constructionLabel}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums print:px-1 print:py-0.5">
                      {formatAmountPlain(row.areaSqft)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums print:px-1 print:py-0.5">
                      {formatAmountPlain(row.alv)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums print:px-1 print:py-0.5">
                      {formatAmountPlain(row.tax)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground print:py-2 print:text-[7px]"
                  >
                    No floor assessment data available
                  </TableCell>
                </TableRow>
              )}
              {notice.floorRows.length > 0 && (
                <TableRow className="border-t-2 border-[var(--dn-border)] bg-slate-100 font-bold print:text-[7px]">
                  <TableCell
                    colSpan={3}
                    className="uppercase tracking-wide text-[var(--dn-primary)] print:px-1 print:py-0.5"
                  >
                    Total
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums print:px-1 print:py-0.5">
                    {formatAmountPlain(notice.totalArea)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums print:px-1 print:py-0.5">
                    {formatAmountPlain(notice.totalAlv)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-base tabular-nums text-[var(--dn-primary)] print:px-1 print:py-0.5 print:text-[7px]">
                    ₹ {formatAmountPlain(notice.totalTax)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {notice.floorRows.length > 0 && (
          <p className="demand-notice-print-hide border-t border-border/50 bg-muted/15 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Formula:</span> Gross ALV = Area × yearly rate
            {notice.floorRows.some((r) => r.usageMult !== 1) && " × usage multiplier"} · Yearly Assessable = Gross ALV ×{" "}
            {assessablePct}% · Property tax = Yearly Assessable ÷ 100 × {taxOnAssessablePct} ({effectivePct}% effective)
            · Water = Yearly Assessable ÷ 100 × {waterPerHundred} · Drainage = Yearly Assessable ÷ 100 ×{" "}
            {drainagePerHundred}
          </p>
        )}
      </div>
    </section>
  );
}
