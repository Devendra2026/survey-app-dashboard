"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { fmtDay } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface SurveyRow {
  _id: string;
  _creationTime: number;
  propertyId?: string;
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
  const [sorting, setSorting] = useState<SortingState>([{ id: "_creationTime", desc: true }]);

  const columns = useMemo(
    () => [
      col.accessor("propertyId", {
        header: "Property ID",
        cell: (c) => <span className="font-mono text-xs">{c.getValue() || "—"}</span>,
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
        header: "",
        cell: (c) => (
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={`${hrefBase}/${c.row.original._id}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ),
      }),
    ],
    [hrefBase],
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

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
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
            <TableRow key={r.id}>
              {r.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
