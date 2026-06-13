"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMasters } from "@/hooks/masters/useMasters";
import { useFrontThumbnails } from "@/hooks/surveys/usePhotos";
import { SURVEY_ROW_TONE } from "@/lib/design-system";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { resolveOwnerDisplayName } from "@/lib/survey/resolve-owner-name";
import { fmtDay } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Eye, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface SurveyRow {
  _id: string;
  _creationTime: number;
  propertyId?: string;
  municipalityId?: string;
  propertyUse?: string;
  parcelNo: string;
  respondentName?: string;
  owners?: { name?: string }[];
  surveyorName?: string;
  mobileNo: string;
  wardNo: string;
  city: string;
  status: SurveyStatus;
  qcStatus: QcStatus;
  submittedAt?: number;
}

const col = createColumnHelper<SurveyRow>();

function surveyRowTone(row: SurveyRow) {
  if (row.qcStatus === "approved") return SURVEY_ROW_TONE.approved;
  if (row.qcStatus === "rejected") return SURVEY_ROW_TONE.rejected;
  if (row.qcStatus === "pending") return SURVEY_ROW_TONE.qcPending;
  if (row.status === "submitted") return SURVEY_ROW_TONE.submitted;
  return SURVEY_ROW_TONE.draft;
}

function SurveyRegistryTable({
  rows,
  pageStart = 0,
  hrefBase = "/surveys",
  showSurveyor = false,
}: {
  rows: SurveyRow[];
  pageStart?: number;
  hrefBase?: string;
  showSurveyor?: boolean;
}) {
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);

  return (
    <div className="premium-card overflow-x-auto rounded-xl border border-border/60 bg-card/90 shadow-premium-sm backdrop-blur-sm">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-b border-brand-navy/10 bg-linear-to-r from-brand-navy/6 via-muted/25 to-brand-navy/4 hover:from-brand-navy/6 dark:border-primary/15 dark:from-primary/12 dark:via-muted/10 dark:to-primary/6">
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              S.No
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Action
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Status
            </TableHead>
            {showSurveyor && (
              <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Surveyor Name
              </TableHead>
            )}
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Property ID
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Ward No.
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Parcel
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Owner Name
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Mobile
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row._id}
              className={`h-12 border-b border-border/40 text-sm transition-colors last:border-b-0 ${surveyRowTone(row)}`}
            >
              <TableCell className="py-2.5 tabular-nums text-muted-foreground">{pageStart + index + 1}</TableCell>
              <TableCell className="py-2.5">
                <Button
                  asChild
                  size="sm"
                  className="h-7 cursor-pointer rounded-full bg-brand-navy/10 px-3 text-xs font-semibold text-brand-navy ring-1 ring-brand-navy/25 transition-colors duration-200 hover:bg-brand-navy hover:text-white hover:ring-brand-navy dark:bg-primary/15 dark:text-primary-foreground dark:ring-primary/30 dark:hover:bg-primary"
                >
                  <Link href={`${hrefBase}/${row._id}`}>
                    <Eye className="h-3 w-3" /> View
                  </Link>
                </Button>
              </TableCell>
              <TableCell className="py-2.5">
                <QcStatusBadge status={row.qcStatus} />
              </TableCell>
              {showSurveyor && <TableCell className="py-2.5 font-medium">{row.surveyorName || "—"}</TableCell>}
              <TableCell className="py-2.5 font-mono text-xs font-medium">
                {resolveDisplayPropertyId(row, ulbCodes) || "—"}
              </TableCell>
              <TableCell className="py-2.5 tabular-nums">{row.wardNo}</TableCell>
              <TableCell className="py-2.5 font-mono text-xs">{row.parcelNo}</TableCell>
              <TableCell className="py-2.5 font-medium">{resolveOwnerDisplayName(row)}</TableCell>
              <TableCell className="py-2.5 tabular-nums">{row.mobileNo}</TableCell>
              <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                {fmtDay(row._creationTime)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SurveyTable({
  rows,
  hrefBase = "/surveys",
  variant = "default",
  showSurveyor = false,
  pageStart = 0,
}: {
  rows?: SurveyRow[];
  hrefBase?: string;
  variant?: "default" | "qc";
  /** Show assigned field collector — admin/supervisor views only. */
  showSurveyor?: boolean;
  pageStart?: number;
}) {
  const isQc = variant === "qc";
  const actionLabel = isQc ? "Review" : "View";
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "propertyId", desc: false }]);
  const surveyIds = useMemo(() => (rows ?? []).map((r) => r._id), [rows]);
  const thumbnails = useFrontThumbnails(isQc ? surveyIds : []);

  const columns = useMemo(
    () => [
      col.display({
        id: "serialNo",
        header: "S.No",
        cell: (c) => <span className="tabular-nums text-muted-foreground">{c.row.index + 1}</span>,
      }),
      col.display({
        id: "photo",
        header: "Photo",
        cell: (c) => {
          const url = thumbnails?.[c.row.original._id];
          return (
            <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30">
              {url ? (
                <Image
                  src={url}
                  alt="Property front"
                  width={56}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground/50" aria-hidden />
              )}
            </div>
          );
        },
      }),
      col.accessor((row) => resolveDisplayPropertyId(row, ulbCodes) ?? "", {
        id: "propertyId",
        header: "Property ID",
        cell: (c) => <span className="font-mono text-xs font-medium text-foreground">{c.getValue() || "—"}</span>,
      }),
      col.accessor("respondentName", {
        header: "Owner",
        cell: (c) => <span className="font-medium">{resolveOwnerDisplayName(c.row.original)}</span>,
      }),
      col.accessor("mobileNo", { header: "Mobile", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
      col.accessor("parcelNo", {
        header: "Parcel",
        cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span>,
      }),
      col.accessor("wardNo", { header: "Ward", cell: (c) => `W${c.getValue()}` }),
      col.accessor("city", { header: "ULB" }),
      ...(showSurveyor
        ? [
            col.accessor("surveyorName", {
              header: "Surveyor",
              cell: (c) => <span className="text-muted-foreground">{c.getValue() || "—"}</span>,
            }),
          ]
        : []),
      col.accessor("status", { header: "Status", cell: (c) => <SurveyStatusBadge status={c.getValue()} /> }),
      col.accessor("qcStatus", { header: "QC", cell: (c) => <QcStatusBadge status={c.getValue()} /> }),
      col.accessor("submittedAt", {
        id: "submittedAt",
        header: "Submitted",
        cell: (c) => {
          const ts = c.getValue() ?? c.row.original._creationTime;
          return <span className="whitespace-nowrap text-muted-foreground">{fmtDay(ts)}</span>;
        },
      }),
      col.display({
        id: "open",
        header: "Action",
        cell: (c) => (
          <Button
            asChild
            size="sm"
            className="h-7 rounded-full bg-warning/15 px-3 text-xs font-semibold text-amber-950 ring-1 ring-warning/40 hover:bg-warning hover:text-amber-950 hover:ring-warning dark:bg-warning/12 dark:text-amber-200 dark:hover:bg-warning/90 dark:hover:text-amber-950"
          >
            <Link href={`${hrefBase}/${c.row.original._id}`}>
              <Eye className="h-3 w-3" /> {actionLabel}
            </Link>
          </Button>
        ),
      }),
    ],
    [hrefBase, ulbCodes, actionLabel, thumbnails, showSurveyor],
  );

  const table = useReactTable({
    data: rows ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (rows === undefined) return <TableSkeleton rows={8} />;
  if (rows.length === 0) {
    return <EmptyState title="No surveys found" description="Adjust your filters or search term to see results." />;
  }

  if (!isQc) {
    return <SurveyRegistryTable rows={rows} pageStart={pageStart} hrefBase={hrefBase} showSurveyor={showSurveyor} />;
  }

  return (
    <div className="premium-card overflow-hidden rounded-xl border border-border/60 bg-card/90 shadow-premium-sm backdrop-blur-sm">
      <Table className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow
              key={hg.id}
              className="border-b border-brand-navy/10 bg-linear-to-r from-brand-navy/6 via-muted/25 to-brand-navy/4 hover:from-brand-navy/6 dark:border-primary/15 dark:from-primary/12 dark:via-muted/10 dark:to-primary/6"
            >
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 transition-colors hover:text-foreground"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    </button>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((r) => (
            <TableRow
              key={r.id}
              className={`h-12 border-b border-border/40 text-sm transition-colors last:border-b-0 ${surveyRowTone(r.original)}`}
            >
              {r.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2.5 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
