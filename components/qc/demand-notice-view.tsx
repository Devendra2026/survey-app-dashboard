"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMasters } from "@/hooks/masters/useMasters";
import {
  buildOfficeTitles,
  buildSurveyAddress,
  computeDemandNotice,
  formatAmountPlain,
  formatInr,
  formatNoticeDate,
} from "@/lib/qc/demand-notice";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import type { SurveyDetail } from "@/schema/surveys/index";
import { ArrowLeft, ChevronRight, ImageOff, Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type DemandNoticeViewProps = {
  survey: SurveyDetail;
  surveyId: string;
  backHref?: string;
};

function BilingualLabel({ en, hi }: { en: string; hi: string }) {
  return (
    <span>
      {en} / <span className="font-medium text-muted-foreground">{hi}</span>
    </span>
  );
}

function InfoBox({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold leading-snug text-slate-900">{value}</p>
    </div>
  );
}

function SiteImage({ src, alt, label }: { src?: string | null; alt: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-square w-full bg-slate-100">
        {src ? (
          <Image src={src} alt={alt} fill unoptimized sizes="240px" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <ImageOff className="h-8 w-8 opacity-40" />
            <p className="text-xs font-medium">No {label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DemandNoticeView({ survey, surveyId, backHref = `/qc/${surveyId}/report` }: DemandNoticeViewProps) {
  const { masters } = useMasters();
  const ulbCodes = buildUlbCodeMap(masters?.ulbs);
  const propertyId = resolveDisplayPropertyId(survey, ulbCodes) ?? survey.propertyId ?? survey.parcelNo;
  const ownerName = survey.respondentName || survey.owners?.[0]?.name || "—";
  const ulb = masters?.ulbs?.find((m) => m._id === survey.municipalityId);
  const district = masters?.districts?.find((d) => d._id === survey.districtId);
  const cityName = ulb?.name ?? survey.city ?? "—";
  const stateName = district?.stateName ?? "Uttar Pradesh";
  const office = buildOfficeTitles(cityName, stateName);
  const taxZone = labelFromOptions(masters?.taxRateZones, survey.taxRateZone);
  const address = buildSurveyAddress(survey);
  const notice = computeDemandNotice(survey, survey.floors ?? [], masters ?? undefined);
  const noticeDate = formatNoticeDate(survey.submittedAt ?? Date.now());
  const assessmentYear = survey.assessmentYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const frontPhoto = survey.photos?.find((p) => p.slot === "front")?.url;
  const mapPhoto = survey.gps
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${survey.gps.latitude},${survey.gps.longitude}&zoom=17&size=400x400&markers=${survey.gps.latitude},${survey.gps.longitude},lightblue1`
    : survey.photos?.find((p) => p.slot === "side")?.url;

  return (
    <div className="demand-notice space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground print:hidden">
        <Link href="/qc" className="font-medium transition-colors hover:text-foreground">
          QC Workflow
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/qc/${surveyId}/report`} className="font-medium transition-colors hover:text-foreground">
          Reports
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">Demand Notice</span>
      </nav>

      <div className="demand-notice-toolbar flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline" size="sm" className="rounded-lg">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" /> Back to QC Report
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print Notice
        </Button>
      </div>

      {/* Document */}
      <article className="demand-notice-document mx-auto max-w-4xl overflow-hidden rounded-sm border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <header className="border-b-4 border-blue-700 px-8 pb-5 pt-8 text-center">
          <p className="font-serif text-lg font-bold leading-relaxed text-slate-900">{office.hindi}</p>
          <p className="mt-1 font-serif text-base font-semibold text-slate-700">{office.english}</p>
        </header>

        <div className="space-y-6 px-8 py-6">
          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 text-sm">
            <p>
              <span className="font-semibold text-slate-600">Assessment Year:</span>{" "}
              <span className="font-bold text-slate-900">{assessmentYear}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-600">Notice Date:</span>{" "}
              <span className="font-bold text-slate-900">{noticeDate}</span>
            </p>
          </div>

          {/* Property grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBox label="Property Zone" value={taxZone.toUpperCase()} />
            <InfoBox
              label={<BilingualLabel en="Ward" hi="वार्ड संख्या" />}
              value={`वार्ड नंबर ${survey.wardNo} (Ward No. ${survey.wardNo})`}
            />
            <InfoBox label={<BilingualLabel en="Unique ID" hi="यूनिक आईडी" />} value={propertyId} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox label="Property Owner" value={ownerName} />
            <InfoBox label="Address" value={address || "—"} />
          </div>

          {/* Assessment table */}
          <section>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <BilingualLabel en="Assessment Details" hi="मूल्यांकन विवरण" />
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase text-slate-600">
                      <BilingualLabel en="Floor" hi="तल" />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-600">
                      <BilingualLabel en="Usage" hi="उपयोग" />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-600">
                      <BilingualLabel en="Construction" hi="निर्माण" />
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase text-slate-600">
                      Area (SqFt)
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase text-slate-600">ALV (₹)</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase text-slate-600">
                      Tax (10%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notice.floorRows.length > 0 ? (
                    notice.floorRows.map((row, i) => (
                      <TableRow
                        key={`${row.floorLabel}-${i}`}
                        className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                      >
                        <TableCell className="font-semibold text-slate-800">{row.floorLabel}</TableCell>
                        <TableCell className="text-slate-600">{row.usageLabel}</TableCell>
                        <TableCell className="text-slate-600">{row.constructionLabel}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatAmountPlain(row.areaSqft)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatAmountPlain(row.alv)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          {formatAmountPlain(row.tax)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        No floor assessment data available
                      </TableCell>
                    </TableRow>
                  )}
                  {notice.floorRows.length > 0 && (
                    <TableRow className="border-t-2 border-slate-300 bg-slate-50 font-bold hover:bg-slate-50">
                      <TableCell colSpan={3} className="uppercase tracking-wide text-slate-700">
                        Total Assessment
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatAmountPlain(notice.totalArea)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatAmountPlain(notice.totalAlv)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-base tabular-nums text-slate-900">
                        ₹ {formatAmountPlain(notice.totalTax)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* Imagery + demand summary */}
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
            <section>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <BilingualLabel en="Site Imagery" hi="साइट छवि" />
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <SiteImage src={frontPhoto} alt="Property front view" label="front photo" />
                <SiteImage src={mapPhoto} alt="Property location map" label="map view" />
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50/90 shadow-sm">
              <div className="border-b border-indigo-200/80 px-4 py-3">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">
                  <BilingualLabel en="Demand Summary" hi="मांग सारांश" />
                </h2>
              </div>
              <div className="divide-y divide-indigo-200/60 px-4">
                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-700">Property Tax (10%)</span>
                  <span className="font-mono font-semibold tabular-nums">{formatInr(notice.propertyTax)}</span>
                </div>
                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-700">Water Tax (7%)</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {notice.waterTax > 0 ? formatInr(notice.waterTax) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-700">Drainage / Sewer Tax (2.5%)</span>
                  <span className="font-mono font-semibold tabular-nums">{formatInr(notice.drainageTax)}</span>
                </div>
              </div>
              <div className="border-t border-indigo-300 bg-indigo-100/80 px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                  <BilingualLabel en="Total Annual Demand" hi="कुल वार्षिक मांग" />
                </p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums text-blue-700">
                  {notice.totalAnnualDemand > 0 ? formatInr(notice.totalAnnualDemand) : "—"}
                </p>
              </div>
            </section>
          </div>

          {/* Notice text */}
          <section className="space-y-3 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-700">
            <p>
              Any objection to this assessment must be submitted in writing to the Executive Officer within{" "}
              <strong>15 days</strong> from the date of this notice. Failure to do so will result in the demand being
              considered final and recoverable as arrears.
            </p>
            <p className="text-slate-600">
              इस मूल्यांकन पर कोई भी आपत्ति इस नोटिस की तिथि से <strong>15 दिनों</strong> के भीतर कार्यकारी अधिकारी को
              लिखित रूप में प्रस्तुत की जानी चाहिए। ऐसा न करने पर मांग को अंतिम मानकर बकाया के रूप में वसूली जाएगी।
            </p>
          </section>

          {/* Signature */}
          <div className="flex justify-end pt-4">
            <div className="w-64 text-center">
              <div className="mb-2 h-12 border-b border-slate-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Executive Officer</p>
              <p className="text-[11px] text-slate-500">Tax Collector Department</p>
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-8 py-4 text-center">
          <p className="text-[11px] leading-relaxed text-slate-500">
            This is a computer-generated document. Digital signatures are verified by the Municipal Board of {stateName}
            .
          </p>
        </footer>
      </article>
    </div>
  );
}
