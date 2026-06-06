"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMasters } from "@/hooks/masters/useMasters";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { fmtDay } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Eye } from "lucide-react";
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
  mobileNo: string;
  wardNo: string;
  city: string;
  status: SurveyStatus;
  qcStatus: QcStatus;
  submittedAt?: number;
}

const col = createColumnHelper<SurveyRow>();

export function SurveyTable({
  rows,
  hrefBase = "/surveys",
  variant = "default",
}: {
  rows?: SurveyRow[];
  hrefBase?: string;
  variant?: "default" | "qc";
}) {
  const isQc = variant === "qc";
  const actionLabel = isQc ? "Review" : "View";
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "propertyId", desc: false }]);

  const columns = useMemo(
    () => [
      col.display({
        id: "serialNo",
        header: "S.No",
        cell: (c) => <span className="tabular-nums text-muted-foreground">{c.row.index + 1}</span>,
      }),
      col.accessor((row) => resolveDisplayPropertyId(row, ulbCodes) ?? "", {
        id: "propertyId",
        header: "Property ID",
        cell: (c) => <span className="font-mono text-xs font-medium text-foreground">{c.getValue() || "—"}</span>,
      }),
      col.accessor("respondentName", {
        header: "Owner",
        cell: (c) => <span className="font-medium">{c.getValue() || "—"}</span>,
      }),
      col.accessor("mobileNo", { header: "Mobile", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
      col.accessor("parcelNo", {
        header: "Parcel",
        cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span>,
      }),
      col.accessor("wardNo", { header: "Ward", cell: (c) => `W${c.getValue()}` }),
      col.accessor("city", { header: "ULB" }),
      col.accessor("status", { header: "Status", cell: (c) => <SurveyStatusBadge status={c.getValue()} /> }),
      col.accessor("qcStatus", { header: "QC", cell: (c) => <QcStatusBadge status={c.getValue()} /> }),
      ...(isQc
        ? [
            col.accessor("submittedAt", {
              id: "submittedAt",
              header: "Submitted",
              cell: (c) => {
                const ts = c.getValue() ?? c.row.original._creationTime;
                return <span className="whitespace-nowrap text-muted-foreground">{fmtDay(ts)}</span>;
              },
            }),
          ]
        : [
            col.accessor("_creationTime", {
              header: "Created",
              cell: (c) => <span className="whitespace-nowrap text-muted-foreground">{fmtDay(c.getValue())}</span>,
            }),
          ]),
      col.display({
        id: "open",
        header: "Action",
        cell: (c) => (
          <Button
            asChild
            size="sm"
            className={
              isQc
                ? "h-7 rounded-full bg-amber-600/10 px-3 text-xs font-semibold text-amber-800 ring-1 ring-amber-300/60 hover:bg-amber-600 hover:text-white hover:ring-amber-600 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-700/50 dark:hover:bg-amber-500 dark:hover:text-white"
                : "h-7 rounded-full bg-indigo-600/10 px-3 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-300/60 hover:bg-indigo-600 hover:text-white hover:ring-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-700/50 dark:hover:bg-indigo-500 dark:hover:text-white"
            }
          >
            <Link href={`${hrefBase}/${c.row.original._id}`}>
              <Eye className="h-3 w-3" /> {actionLabel}
            </Link>
          </Button>
        ),
      }),
    ],
    [hrefBase, ulbCodes, isQc, actionLabel],
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

  const rowTone = (row: SurveyRow) => {
    if (row.qcStatus === "approved") return "bg-emerald-500/5 hover:bg-emerald-500/10";
    if (row.qcStatus === "rejected") return "bg-rose-500/5 hover:bg-rose-500/10";
    if (row.qcStatus === "pending") return "bg-amber-500/5 hover:bg-amber-500/10";
    if (row.status === "submitted") return "bg-indigo-500/5 hover:bg-indigo-500/10";
    return "hover:bg-muted/40";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <Table className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow
              key={hg.id}
              className="border-b border-border/60 bg-linear-to-r from-slate-50 to-muted/30 hover:from-slate-50 hover:to-muted/30 dark:from-slate-900/60 dark:to-muted/10 dark:hover:from-slate-900/60"
            >
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="h-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <button
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
              className={`h-12 border-b border-border/40 text-sm transition-colors last:border-b-0 ${rowTone(r.original)}`}
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
