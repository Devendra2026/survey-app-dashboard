"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { QcStatusBadge } from "@/components/shared/status-badge";
import { SurveyRegistrySearch } from "@/components/surveys/survey-registry-search";
import type { SurveyRow } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMasters } from "@/hooks/masters/useMasters";
import { SURVEY_ROW_TONE } from "@/lib/design-system";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { resolveOwnerDisplayName } from "@/lib/survey/resolve-owner-name";
import { cn, fmtDay } from "@/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

export { SurveyRegistrySearch as QcRegistrySearch };

/** QC portal wrapper — amber border styling for registry search. */
export function QcRegistrySearchBar(props: { value: string; onChange: (term: string) => void }) {
  return (
    <SurveyRegistrySearch
      {...props}
      placeholder="Search property ID, owner, parcel, or ward…"
      inputClassName="h-10 rounded-lg border-amber-300/40 bg-background pl-9 dark:border-amber-700/40"
    />
  );
}

export type QcRegistryRow = SurveyRow & { surveyorName?: string };

function surveyRowTone(row: QcRegistryRow) {
  if (row.qcStatus === "approved") return SURVEY_ROW_TONE.approved;
  if (row.qcStatus === "rejected") return SURVEY_ROW_TONE.rejected;
  if (row.qcStatus === "pending") return SURVEY_ROW_TONE.qcPending;
  if (row.status === "submitted") return SURVEY_ROW_TONE.submitted;
  return SURVEY_ROW_TONE.draft;
}

export function QcRegistryTable({
  rows,
  pageStart = 0,
  hrefBase = "/qc",
}: {
  rows?: QcRegistryRow[];
  pageStart?: number;
  hrefBase?: string;
}) {
  const { masters } = useMasters();
  const ulbCodes = masters ? buildUlbCodeMap(masters.ulbs) : undefined;

  if (rows === undefined) return <TableSkeleton rows={8} />;
  if (rows.length === 0) {
    return (
      <EmptyState title="No surveys found" description="Adjust your search or change the ward in Smart Filters." />
    );
  }

  return (
    <div className="premium-card overflow-hidden rounded-xl border border-amber-500/20 bg-card/90 shadow-premium-sm backdrop-blur-sm">
      <Table className="min-w-full">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-b border-amber-500/15 bg-linear-to-r from-amber-500/12 via-amber-500/6 to-transparent hover:from-amber-500/12 dark:from-amber-500/18 dark:via-amber-500/8">
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              S.No
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Action
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Property ID
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Surveyor Name
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Ward No.
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Parcel No.
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Owner Name
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Mobile
            </TableHead>
            <TableHead className="h-10 bg-inherit text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row._id}
              className={cn(
                "h-12 cursor-pointer border-b border-border/40 text-sm transition-colors duration-200 last:border-b-0",
                surveyRowTone(row),
              )}
            >
              <TableCell className="py-2.5 tabular-nums text-muted-foreground">{pageStart + index + 1}</TableCell>
              <TableCell className="py-2.5">
                <Button
                  asChild
                  size="sm"
                  className="h-7 cursor-pointer rounded-full bg-warning/15 px-3 text-xs font-semibold text-amber-950 ring-1 ring-warning/40 transition-colors duration-200 hover:bg-warning hover:text-amber-950 hover:ring-warning dark:bg-warning/12 dark:text-amber-200 dark:hover:bg-warning/90 dark:hover:text-amber-950"
                >
                  <Link href={`${hrefBase}/${row._id}`}>
                    <Eye className="h-3 w-3" /> Review
                  </Link>
                </Button>
              </TableCell>
              <TableCell className="py-2.5">
                <QcStatusBadge status={row.qcStatus} />
              </TableCell>
              <TableCell className="py-2.5 font-mono text-xs font-medium text-foreground">
                {resolveDisplayPropertyId(row, ulbCodes) || "—"}
              </TableCell>
              <TableCell className="py-2.5 font-medium">{row.surveyorName || "—"}</TableCell>
              <TableCell className="py-2.5 tabular-nums">{row.wardNo}</TableCell>
              <TableCell className="py-2.5 font-mono text-xs">{row.parcelNo}</TableCell>
              <TableCell className="py-2.5 font-medium">{resolveOwnerDisplayName(row)}</TableCell>
              <TableCell className="py-2.5 tabular-nums">{row.mobileNo}</TableCell>
              <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                {fmtDay(row.submittedAt ?? row._creationTime)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
