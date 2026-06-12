"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { PageTransition } from "@/components/design-system/motion";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { useSurveyList, useSurveyListPaginated } from "@/hooks/surveys/useSurveys";
import { computeQcWardStats } from "@/lib/qc/ward-stats";
import { ArrowLeft, CheckCircle2, Clock3, FileText, MapPin, Receipt, Table2 } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";

export default function QcWardReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ wardNo: string }>;
  searchParams: Promise<{ municipalityId?: string; tab?: string }>;
}) {
  const { wardNo } = use(params);
  const { municipalityId, tab } = use(searchParams);
  const decodedWard = decodeURIComponent(wardNo);
  const showDemand = tab === "demand";
  const [pageSize, setPageSize] = useState(20);

  const listFilters = useMemo(
    () => ({
      wardNo: decodedWard,
      municipalityId,
      ...(showDemand ? { qcStatus: "approved" as const } : {}),
    }),
    [decodedWard, municipalityId, showDemand],
  );

  const { surveys, isLoading, pageNumber, canGoPrev, canGoNext, goNext, goPrev } = useSurveyListPaginated(
    listFilters,
    pageSize,
  );

  const aggregateSurveys = useSurveyList({
    wardNo: decodedWard,
    municipalityId: municipalityId as string | undefined,
    limit: 300,
  });

  const wards = useWardsForMunicipality(municipalityId);
  const wardLabel = wards?.find((w) => w.wardNo === decodedWard)?.name;

  const wardRow = useMemo(
    () => computeQcWardStats((aggregateSurveys ?? []) as Parameters<typeof computeQcWardStats>[0])[0],
    [aggregateSurveys],
  );

  const listRows = useMemo(() => {
    const rows = surveys ?? [];
    if (showDemand) return rows;
    return rows.filter((r) => r.status !== "draft");
  }, [surveys, showDemand]);

  const title = wardLabel ? `Ward ${decodedWard} — ${wardLabel}` : `Ward ${decodedWard}`;

  return (
    <RoleGate mode="page" capability="qc.review" deniedDescription="Ward reports require QC access.">
      <PageTransition className="space-y-6 lg:space-y-8">
        <Button asChild variant="outline" size="sm" className="w-fit cursor-pointer rounded-xl">
          <Link href="/qc">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Command Center
          </Link>
        </Button>

        <ExecutiveHero
          eyebrow="Ward Report"
          title={title}
          description={
            showDemand
              ? "Approved properties — open demand notices for tax assessment"
              : "QC summary and property records for this ward"
          }
          icon={MapPin}
          gradient="amber"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant={showDemand ? "outline" : "default"}
                size="sm"
                className="cursor-pointer rounded-xl"
              >
                <Link
                  href={`/qc/wards/${encodeURIComponent(decodedWard)}${municipalityId ? `?municipalityId=${municipalityId}` : ""}`}
                >
                  <FileText className="h-4 w-4" aria-hidden /> QC Report
                </Link>
              </Button>
              <Button
                asChild
                variant={showDemand ? "default" : "outline"}
                size="sm"
                className="cursor-pointer rounded-xl"
              >
                <Link
                  href={`/qc/wards/${encodeURIComponent(decodedWard)}?tab=demand${municipalityId ? `&municipalityId=${municipalityId}` : ""}`}
                >
                  <Receipt className="h-4 w-4" aria-hidden /> Demand Notices
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="cursor-pointer rounded-xl">
                <Link
                  href={`/qc/registry?wardNo=${encodeURIComponent(decodedWard)}${municipalityId ? `&municipalityId=${municipalityId}` : ""}`}
                >
                  <Table2 className="h-4 w-4" aria-hidden /> Registry
                </Link>
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="QC Pending"
            value={(wardRow?.pending ?? 0).toLocaleString()}
            icon={Clock3}
            tone="warning"
          />
          <MetricCard
            label="QC Approved"
            value={(wardRow?.approved ?? 0).toLocaleString()}
            icon={CheckCircle2}
            tone="success"
          />
          <MetricCard
            label="Total Properties"
            value={(wardRow?.total ?? 0).toLocaleString()}
            icon={MapPin}
            tone="default"
          />
        </div>

        <GlassCard padding="none" className="overflow-hidden border-amber-500/15">
          <div className="border-b border-amber-500/20 px-5 py-4">
            <SectionHeader
              title={showDemand ? "Demand Notice Register" : "Property QC Register"}
              description={
                showDemand
                  ? `${wardRow?.approved ?? 0} approved properties eligible for demand notice`
                  : `Page ${pageNumber} · ward properties`
              }
            />
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading ward data…</p>
            ) : listRows.length === 0 ? (
              <EmptyState title="No records" description="No properties match this ward view." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/10">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Property ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Owner</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">QC</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listRows.map((row) => (
                    <TableRow key={row._id} className="border-border/40">
                      <TableCell className="font-mono text-xs">{row.propertyId || row.parcelNo}</TableCell>
                      <TableCell>{row.respondentName || "—"}</TableCell>
                      <TableCell>
                        <QcStatusBadge status={row.qcStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-xs">
                            <Link href={`/qc/${row._id}`}>Review</Link>
                          </Button>
                          {row.qcStatus === "approved" && (
                            <>
                              <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-xs">
                                <Link href={`/qc/${row._id}/report`}>
                                  <FileText className="h-3 w-3" aria-hidden /> Report
                                </Link>
                              </Button>
                              <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-xs">
                                <Link href={`/qc/${row._id}/demand-notice`}>
                                  <Receipt className="h-3 w-3" aria-hidden /> Demand
                                </Link>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </GlassCard>

        <TablePagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          itemCount={listRows.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={goPrev}
          onNext={goNext}
          pageSizeOptions={[10, 20, 50]}
          onPageSizeChange={setPageSize}
        />
      </PageTransition>
    </RoleGate>
  );
}
