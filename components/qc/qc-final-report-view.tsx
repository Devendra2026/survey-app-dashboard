"use client";

import { generateQcFinalReportPdf } from "@/components/reports/queries/pdf";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMasters } from "@/hooks/masters/useMasters";
import { QC_STATUS_LABEL } from "@/lib/domain";
import { estimateDemandAssessment, formatInr } from "@/lib/qc/demand-estimate";
import { surveyAreaMetrics } from "@/lib/survey/area";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { fmtDate } from "@/lib/utils";
import type { SurveyDetail } from "@/schema/surveys/index";
import { BadgeCheck, ChevronRight, Download, FileText, MapPin, Printer, Share2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type QcFinalReportViewProps = {
  survey: SurveyDetail;
  surveyId: string;
  auditorName?: string;
  backHref?: string;
};

function qcStatusPresentation(qcStatus: SurveyDetail["qcStatus"]) {
  if (qcStatus === "approved") {
    return { label: "Verified & Finalized", className: "text-emerald-600 dark:text-emerald-400" };
  }
  if (qcStatus === "rejected") {
    return { label: "Returned for Correction", className: "text-red-600 dark:text-red-400" };
  }
  return { label: QC_STATUS_LABEL[qcStatus], className: "text-amber-600 dark:text-amber-400" };
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function GeoMapPanel({ latitude, longitude }: { latitude: number; longitude: number }) {
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=16&size=640x360&markers=${latitude},${longitude},red-pushpin`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900 shadow-inner">
      <div className="border-b border-slate-700/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Geo-Tagged Location</p>
      </div>
      <div className="relative aspect-4/3 bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mapUrl} alt="Property geo-tagged location" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/75 px-3 py-2 backdrop-blur-sm">
          <p className="font-mono text-xs font-semibold text-white">
            {Math.abs(latitude).toFixed(4)}° {latitude >= 0 ? "N" : "S"}, {Math.abs(longitude).toFixed(4)}°{" "}
            {longitude >= 0 ? "E" : "W"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function QcFinalReportView({
  survey,
  surveyId,
  auditorName,
  backHref = `/qc/${surveyId}`,
}: QcFinalReportViewProps) {
  const { masters } = useMasters();
  const ulbCodes = buildUlbCodeMap(masters?.ulbs);
  const propertyId = resolveDisplayPropertyId(survey, ulbCodes) ?? survey.propertyId ?? survey.parcelNo;
  const ownerName = survey.respondentName || survey.owners?.[0]?.name || "—";
  const areas = surveyAreaMetrics({
    plotSqft: survey.plotSqft,
    plinthSqft: survey.plinthSqft,
    floors: survey.floors,
  });
  const propertyTypeOptions = survey.propertyUse ? masters?.propertyUseSubcategories?.[survey.propertyUse] : undefined;
  const propertyType =
    labelFromOptions(propertyTypeOptions, survey.propertyType) ||
    labelFromOptions(masters?.propertyUses, survey.propertyUse) ||
    "—";
  const taxZone = labelFromOptions(masters?.taxRateZones, survey.taxRateZone);
  const roadType = labelFromOptions(masters?.roadTypes, survey.roadType);
  const demand = estimateDemandAssessment(survey, areas.builtUpSqft);
  const qcStatus = qcStatusPresentation(survey.qcStatus);
  const certifiedAt = survey.submittedAt ?? Date.now();

  const pdfOptions = {
    auditorName,
    masters: masters
      ? {
          propertyUses: masters.propertyUses,
          propertyUseSubcategories: masters.propertyUseSubcategories,
          roadTypes: masters.roadTypes,
          taxRateZones: masters.taxRateZones,
          floors: masters.floors,
          usageTypes: masters.usageTypes,
          usageFactors: masters.usageFactors,
          constructionTypes: masters.constructionTypes,
        }
      : undefined,
  };

  async function shareReport() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Report link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="qc-final-report space-y-6 print:space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground print:hidden">
        <Link href="/qc" className="font-medium transition-colors hover:text-foreground">
          QC Workflow
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium">Reports</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{propertyId}</span>
      </nav>

      {/* Report header */}
      <div className="flex flex-col gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            QC Final Report
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Comprehensive verification and finalized assessment for Property ID:{" "}
            <span className="font-mono font-semibold text-foreground">{propertyId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={shareReport}>
            <Share2 className="h-4 w-4" /> Share with Owner
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href={`/qc/${surveyId}/demand-notice`}>
              <FileText className="h-4 w-4" /> Generate Demand Notice
            </Link>
          </Button>
          <Button
            size="sm"
            className="rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-500"
            onClick={() => generateQcFinalReportPdf(survey, pdfOptions)}
          >
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Property summary */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="grid gap-6 border-b border-border/50 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Final QC Status</p>
            <p className={`text-lg font-black ${qcStatus.className}`}>{qcStatus.label}</p>
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Owner Name</p>
            <p className="text-lg font-bold text-foreground">{ownerName}</p>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryField label="Ward Number" value={survey.wardNo ? `Ward No. ${survey.wardNo}` : "—"} />
          <SummaryField label="Property Type" value={propertyType} />
          <SummaryField label="Tax Rate Zone" value={taxZone} />
          <SummaryField label="Road Type" value={roadType} />
        </div>
      </section>

      {/* Main grid: floors + sidebar */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* Floor breakdown */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Floor-wise Area Breakdown
            </h2>
          </div>
          {survey.floors?.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Floor Level</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Usage Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Construction</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">
                      Built-up (Sqft)
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {survey.floors.map((floor, i) => (
                    <TableRow
                      key={floor._id}
                      className={`border-b border-border/40 ${i % 2 === 0 ? "bg-background" : "bg-muted/15"}`}
                    >
                      <TableCell className="font-semibold capitalize">
                        {labelFromOptions(masters?.floors, floor.floorName)}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {labelFromOptions(masters?.usageTypes, floor.usageType) ||
                          labelFromOptions(masters?.usageFactors, floor.usageFactor)}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {labelFromOptions(masters?.constructionTypes, floor.constructionType)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums">
                        {floor.areaSqft.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Measured
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No floor records available</p>
          )}
          <div className="flex items-center justify-between border-t border-border/50 bg-blue-50/50 px-5 py-4 dark:bg-blue-950/20">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Total Assessable Area
            </span>
            <span className="font-mono text-2xl font-black tabular-nums text-blue-600 dark:text-blue-400">
              {areas.builtUpSqft > 0
                ? areas.builtUpSqft.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "—"}
            </span>
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-5">
          {/* Demand assessment */}
          <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 text-slate-100 shadow-lg">
            <div className="border-b border-slate-700/60 px-4 py-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Demand Assessment</h2>
            </div>
            <div className="divide-y divide-slate-700/50 px-4">
              {demand.lines.map((line) => (
                <div key={line.label} className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-300">{line.label}</span>
                  <span className="font-mono text-sm font-semibold tabular-nums">{formatInr(line.amount)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-700/60 bg-slate-800/80 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Annual Demand</p>
              <p className="mt-1 font-mono text-3xl font-black tabular-nums text-blue-400">
                {demand.total > 0 ? formatInr(demand.total) : "—"}
              </p>
            </div>
          </section>

          {/* Geo map */}
          {survey.gps ? (
            <GeoMapPanel latitude={survey.gps.latitude} longitude={survey.gps.longitude} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900">
              <div className="border-b border-slate-700/50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Geo-Tagged Location</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-slate-500">
                <MapPin className="h-8 w-8 opacity-40" />
                <p className="text-sm">No GPS coordinates captured</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certification footer */}
      <section className="grid gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:grid-cols-[1fr_1fr_auto] lg:items-center">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Auditor Digital Signature
          </p>
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5">
            <p className="font-serif text-2xl italic text-slate-600 dark:text-slate-300">{auditorName ?? "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Certified Auditor</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Certification Timestamp
          </p>
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
            {fmtDate(certifiedAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            Surveyor: {survey.surveyor?.name ?? "—"} · {survey.city ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50 px-5 py-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Compliance Check</p>
              <p className="text-sm font-semibold">Document Integrity Verified</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-start print:hidden">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={backHref}>
            <BadgeCheck className="h-4 w-4" /> Back to QC Review
          </Link>
        </Button>
      </div>
    </div>
  );
}
