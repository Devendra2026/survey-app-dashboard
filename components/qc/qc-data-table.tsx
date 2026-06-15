"use client";

import { QcParcelNumberCell, QcPropertyUseCell } from "@/components/qc/qc-registry-cells";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { QcStatusBadge } from "@/components/shared/status-badge";
import type { SurveyRow } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MasterOption } from "@/convex/areaMasters";
import { QC_TABLE, SURVEY_ROW_TONE } from "@/lib/design-system";
import type { ParcelSiblingIndex } from "@/lib/qc/parcel-siblings";
import { formatRegistryWardNo } from "@/lib/survey/format-registry-parcel";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { resolveOwnerDisplayName } from "@/lib/survey/resolve-owner-name";
import { cn, fmtDay } from "@/lib/utils";
import { Eye, FileText, Receipt } from "lucide-react";
import Link from "next/link";

export type QcDataTableRow = SurveyRow & { surveyorName?: string; unitNo?: string };

function surveyRowTone(row: QcDataTableRow) {
  if (row.qcStatus === "approved") return SURVEY_ROW_TONE.approved;
  if (row.qcStatus === "rejected") return SURVEY_ROW_TONE.rejected;
  if (row.qcStatus === "pending") return SURVEY_ROW_TONE.qcPending;
  if (row.status === "submitted") return SURVEY_ROW_TONE.submitted;
  return SURVEY_ROW_TONE.draft;
}

export function QcDataTable({
  rows,
  pageStart = 0,
  hrefBase = "/qc",
  siblingIndex,
  propertyUses,
  ulbCodes,
  showSurveyor = true,
  showDemandActions = false,
  emptyTitle = "No surveys found",
  emptyDescription = "Adjust your search or change the ward in Smart Filters.",
}: {
  rows?: QcDataTableRow[];
  pageStart?: number;
  hrefBase?: string;
  siblingIndex?: ParcelSiblingIndex;
  propertyUses?: MasterOption[];
  ulbCodes?: Map<string, string>;
  showSurveyor?: boolean;
  showDemandActions?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows === undefined) return <TableSkeleton rows={8} />;
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={QC_TABLE.wrapper}>
      <div className={QC_TABLE.scroll}>
        <Table className={QC_TABLE.table}>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className={QC_TABLE.headerRow}>
              <TableHead className={QC_TABLE.headerCell}>S. No</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Action</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Status</TableHead>
              {showSurveyor && <TableHead className={QC_TABLE.headerCell}>Surveyor Name</TableHead>}
              <TableHead className={QC_TABLE.headerCell}>Property ID</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Ward Number</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Parcel Number</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Property Use</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Owner Name</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Mobile</TableHead>
              <TableHead className={QC_TABLE.headerCell}>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row._id} className={cn(QC_TABLE.bodyRow, surveyRowTone(row))}>
                <TableCell className={cn(QC_TABLE.bodyCell, "tabular-nums text-muted-foreground")}>
                  {pageStart + index + 1}
                </TableCell>
                <TableCell className={QC_TABLE.bodyCell}>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      asChild
                      size="sm"
                      className="h-7 cursor-pointer rounded-full bg-warning/15 px-3 text-xs font-semibold text-amber-950 ring-1 ring-warning/40 transition-colors duration-200 hover:bg-warning hover:text-amber-950 hover:ring-warning dark:bg-warning/12 dark:text-amber-200 dark:hover:bg-warning/90 dark:hover:text-amber-950"
                    >
                      <Link href={`${hrefBase}/${row._id}`}>
                        <Eye className="h-3 w-3" aria-hidden /> Review
                      </Link>
                    </Button>
                    {showDemandActions && row.qcStatus === "approved" && (
                      <>
                        <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-xs">
                          <Link href={`${hrefBase}/${row._id}/report`}>
                            <FileText className="h-3 w-3" aria-hidden /> Report
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-xs">
                          <Link href={`${hrefBase}/${row._id}/demand-notice`}>
                            <Receipt className="h-3 w-3" aria-hidden /> Demand
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className={QC_TABLE.bodyCell}>
                  <QcStatusBadge status={row.qcStatus} />
                </TableCell>
                {showSurveyor && (
                  <TableCell className={cn(QC_TABLE.bodyCell, "font-medium")}>{row.surveyorName || "—"}</TableCell>
                )}
                <TableCell className={cn(QC_TABLE.bodyCell, QC_TABLE.monoCell)}>
                  {resolveDisplayPropertyId(row, ulbCodes) || "—"}
                </TableCell>
                <TableCell className={cn(QC_TABLE.bodyCell, "tabular-nums font-mono text-xs")}>
                  {formatRegistryWardNo(row.wardNo)}
                </TableCell>
                <TableCell className={QC_TABLE.bodyCell}>
                  <QcParcelNumberCell row={row} siblingIndex={siblingIndex} ulbCodes={ulbCodes} />
                </TableCell>
                <TableCell className={QC_TABLE.bodyCell}>
                  <QcPropertyUseCell propertyUse={row.propertyUse} propertyUses={propertyUses} />
                </TableCell>
                <TableCell className={cn(QC_TABLE.bodyCell, "font-medium")}>{resolveOwnerDisplayName(row)}</TableCell>
                <TableCell className={cn(QC_TABLE.bodyCell, "tabular-nums")}>{row.mobileNo}</TableCell>
                <TableCell className={cn(QC_TABLE.bodyCell, "whitespace-nowrap text-muted-foreground")}>
                  {fmtDay(row.submittedAt ?? row._creationTime)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Hook-friendly helper when masters are loaded in parent. */
export function useQcTableUlbCodes(ulbs: { _id: string; code: string }[] | undefined) {
  return ulbs ? buildUlbCodeMap(ulbs) : undefined;
}
