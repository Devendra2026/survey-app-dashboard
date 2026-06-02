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
import { ArrowUpDown } from "lucide-react";
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

export function SurveyTable({ rows, hrefBase = "/surveys" }: { rows?: SurveyRow[]; hrefBase?: string }) {
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
      col.accessor("_creationTime", {
        header: "Created",
        cell: (c) => <span className="whitespace-nowrap text-muted-foreground">{fmtDay(c.getValue())}</span>,
      }),
      col.display({
        id: "open",
        header: "Action",
        cell: (c) => (
          <Button asChild variant="outline" size="sm" className="h-8 px-3">
            <Link href={`${hrefBase}/${c.row.original._id}`}>View</Link>
          </Button>
        ),
      }),
    ],
    [hrefBase, ulbCodes],
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
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-sm dark:bg-card/85">
      <Table className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50 dark:bg-muted/20">
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="h-11 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <button
                      className="flex items-center gap-1 transition-colors hover:text-foreground"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
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
              className={`h-12 border-b border-border/50 text-sm transition-colors ${rowTone(r.original)}`}
            >
              {r.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-3 align-middle">
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
