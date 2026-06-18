"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { SurveyStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SURVEY_ROW_TONE, SURVEY_TABLE } from "@/lib/design-system";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { formatRegistryParcelNo, formatRegistryWardNo } from "@/lib/survey/format-registry-parcel";
import { surveyCompletionPercent } from "@/lib/survey/progress";
import { resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { resolveOwnerDisplayName } from "@/lib/survey/resolve-owner-name";
import { cn, fmtDay } from "@/lib/utils";
import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

export type SurveyDataTableRow = {
  _id: string;
  _creationTime: number;
  propertyId?: string;
  municipalityId?: string;
  parcelNo: string;
  respondentName?: string;
  owners?: { name?: string }[];
  surveyorName?: string;
  wardNo: string;
  city: string;
  status: SurveyStatus;
  qcStatus: QcStatus;
  submittedAt?: number;
  completionPct?: number;
  locality?: string;
  mobileNo?: string;
  ownershipType?: string;
  propertyUse?: string;
  plotSqft?: number;
  gps?: unknown;
  floors?: unknown[];
  photos?: unknown[];
};

function surveyRowTone(row: SurveyDataTableRow) {
  if (row.qcStatus === "approved") return SURVEY_ROW_TONE.approved;
  if (row.qcStatus === "rejected") return SURVEY_ROW_TONE.rejected;
  if (row.qcStatus === "pending") return SURVEY_ROW_TONE.qcPending;
  if (row.status === "submitted") return SURVEY_ROW_TONE.submitted;
  return SURVEY_ROW_TONE.draft;
}

function resolveProgress(row: SurveyDataTableRow): number {
  if (row.completionPct !== undefined) return row.completionPct;
  return surveyCompletionPercent(row);
}

export function SurveyDataTable({
  rows,
  pageStart = 0,
  hrefBase = "/surveys",
  ulbCodes,
  showSurveyor = true,
  emptyTitle = "No surveys found",
  emptyDescription = "Adjust filters or search to find field survey records.",
}: {
  rows?: SurveyDataTableRow[];
  pageStart?: number;
  hrefBase?: string;
  ulbCodes?: Map<string, string>;
  showSurveyor?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows === undefined) return <TableSkeleton rows={8} />;
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={SURVEY_TABLE.wrapper}>
      <div className={SURVEY_TABLE.scroll}>
        <Table className={SURVEY_TABLE.table}>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className={SURVEY_TABLE.headerRow}>
              <TableHead className={SURVEY_TABLE.headerCell}>S. No</TableHead>
              <TableHead className={SURVEY_TABLE.headerCell}>Action</TableHead>
              <TableHead className={SURVEY_TABLE.headerCell}>Status</TableHead>
              <TableHead className={SURVEY_TABLE.headerCell}>Survey Progress</TableHead>
              {showSurveyor && <TableHead className={SURVEY_TABLE.headerCell}>Surveyor Name</TableHead>}
              <TableHead className={SURVEY_TABLE.headerCell}>Property ID</TableHead>
              <TableHead className={SURVEY_TABLE.headerCell}>Ward Number</TableHead>
              <TableHead className={SURVEY_TABLE.headerCell}>Parcel Number</TableHead>
              <TableHead className={SURVEY_TABLE.headerCell}>Owner Name</TableHead>
              <TableHead className={SURVEY_TABLE.headerCell}>Survey Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const progress = resolveProgress(row);
              const isDraft = row.status === "draft";
              return (
                <TableRow key={row._id} className={cn(SURVEY_TABLE.bodyRow, surveyRowTone(row))}>
                  <TableCell className={cn(SURVEY_TABLE.bodyCell, "tabular-nums text-muted-foreground")}>
                    {pageStart + index + 1}
                  </TableCell>
                  <TableCell className={SURVEY_TABLE.bodyCell}>
                    <Button
                      asChild
                      size="sm"
                      className="h-7 cursor-pointer rounded-full bg-indigo-500/15 px-3 text-xs font-semibold text-indigo-950 ring-1 ring-indigo-500/40 transition-colors duration-200 hover:bg-indigo-600 hover:text-white dark:bg-indigo-500/12 dark:text-indigo-100"
                    >
                      <Link href={isDraft ? `${hrefBase}/${row._id}/edit` : `${hrefBase}/${row._id}`}>
                        {isDraft ? (
                          <>
                            <Pencil className="h-3 w-3" aria-hidden /> Edit
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" aria-hidden /> View
                          </>
                        )}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell className={SURVEY_TABLE.bodyCell}>
                    <SurveyStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className={SURVEY_TABLE.bodyCell}>
                    <div className="flex min-w-22 items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1 bg-muted" />
                      <span className="w-8 text-right text-xs font-semibold tabular-nums text-foreground">
                        {progress}%
                      </span>
                    </div>
                  </TableCell>
                  {showSurveyor && (
                    <TableCell className={cn(SURVEY_TABLE.bodyCell, "font-medium")}>
                      {row.surveyorName || "—"}
                    </TableCell>
                  )}
                  <TableCell className={cn(SURVEY_TABLE.bodyCell, SURVEY_TABLE.monoCell)}>
                    {resolveDisplayPropertyId(row, ulbCodes) || "—"}
                  </TableCell>
                  <TableCell className={cn(SURVEY_TABLE.bodyCell, "font-mono text-xs tabular-nums")}>
                    {formatRegistryWardNo(row.wardNo)}
                  </TableCell>
                  <TableCell className={cn(SURVEY_TABLE.bodyCell, SURVEY_TABLE.monoCell)}>
                    {formatRegistryParcelNo(row.parcelNo)}
                  </TableCell>
                  <TableCell className={SURVEY_TABLE.bodyCell}>{resolveOwnerDisplayName(row) || "—"}</TableCell>
                  <TableCell className={cn(SURVEY_TABLE.bodyCell, "text-xs text-muted-foreground")}>
                    {fmtDay(row.submittedAt ?? row._creationTime)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
