"use client";

import { SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { GoogleMapEmbed } from "@/components/shared/google-map-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildOfficeTitles, formatAmountPlain, formatInr, type DemandNoticeData } from "@/lib/qc/demand-notice";
import { DEFAULT_TAX_RATES } from "@/lib/qc/tax-rate-defaults";
import type { SurveyDetail } from "@/schema/surveys/index";
import { Building2, Camera, FileText, ImageOff, Layers, MapPin, Receipt, Ruler, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BilingualLabel({ en, hi }: { en: string; hi: string }) {
  return (
    <span>
      {en} / <span className="font-medium text-muted-foreground">{hi}</span>
    </span>
  );
}

export function NoticeField({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/90 px-3 py-2.5 shadow-premium-sm dark:bg-card/60">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{value}</p>
    </div>
  );
}

export function NoticePhoto({ url, label }: { url?: string | null; label: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="relative aspect-square w-full bg-muted/30">
        {url ? (
          <Image src={url} alt={label} fill unoptimized sizes="240px" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-7 w-7 opacity-40" aria-hidden />
            <p className="text-xs font-medium opacity-60">No {label.toLowerCase()}</p>
          </div>
        )}
      </div>
      <figcaption className="border-t border-border/50 px-3 py-2 text-center text-xs font-semibold text-foreground">
        {label}
      </figcaption>
    </figure>
  );
}

function pctHint(pct: number) {
  return `${(pct * 100).toFixed(0)}% of ALV`;
}

export function DemandNoticeKpiStrip({
  notice,
  noticeDate,
  assessmentYear,
  propertyTaxPct = DEFAULT_TAX_RATES.propertyTaxPct,
}: {
  notice: DemandNoticeData;
  noticeDate: string;
  assessmentYear: string;
  propertyTaxPct?: number;
}) {
  return (
    <section aria-labelledby="notice-kpi-heading" className="print-hidden">
      <SectionHeader
        id="notice-kpi-heading"
        title="Demand Summary"
        description="Computed from floor-wise ALV assessment"
        className="mb-4"
      />
      <StaggerGrid className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        <StaggerItem>
          <MetricCard
            label="Total Demand (Yearly)"
            value={notice.totalAnnualDemand > 0 ? formatInr(notice.totalAnnualDemand) : "—"}
            hint="yearly assessable + water + drainage"
            icon={Receipt}
            tone="ai"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Total ALV"
            value={notice.totalAlv > 0 ? formatInr(notice.totalAlv) : "—"}
            hint="annual letting value"
            icon={Scale}
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Assessed Area"
            value={notice.totalArea > 0 ? `${formatAmountPlain(notice.totalArea)} sq ft` : "—"}
            hint="sum of floor areas"
            icon={Ruler}
            tone="default"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Yearly Assessable"
            value={notice.propertyTax > 0 ? formatInr(notice.propertyTax) : "—"}
            hint="80% assessable base · yearly"
            icon={Building2}
            tone="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Notice Date"
            value={noticeDate}
            hint={`Year ${assessmentYear}`}
            icon={FileText}
            tone="success"
          />
        </StaggerItem>
      </StaggerGrid>
    </section>
  );
}

export function DemandNoticeDocument({
  survey,
  propertyId,
  ownerName,
  office,
  taxZone,
  address,
  notice,
  noticeDate,
  assessmentYear,
  frontPhoto,
  rateConfig,
}: {
  survey: SurveyDetail;
  propertyId: string;
  ownerName: string;
  office: ReturnType<typeof buildOfficeTitles>;
  taxZone: string;
  address: string;
  notice: DemandNoticeData;
  noticeDate: string;
  assessmentYear: string;
  frontPhoto?: string | null;
  rateConfig?: { propertyTaxPct: number; waterTaxPct: number; drainageTaxPct: number } | null;
}) {
  return (
    <article className="demand-notice-document mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-premium-lg">
      <header className="border-b-4 border-brand-navy bg-brand-navy/5 px-6 py-8 text-center dark:border-primary dark:bg-primary/10 sm:px-10">
        <p className="font-heading text-lg font-bold leading-relaxed text-foreground">{office.hindi}</p>
        <p className="mt-1 font-heading text-base font-semibold text-muted-foreground">{office.english}</p>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-red">
          Property Tax Demand Notice / संपत्ति कर मांग नोटिस
        </p>
      </header>

      <div className="space-y-6 px-6 py-6 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4 text-sm">
          <p>
            <span className="font-semibold text-muted-foreground">Assessment Year:</span>{" "}
            <span className="font-bold text-foreground">{assessmentYear}</span>
          </p>
          <p>
            <span className="font-semibold text-muted-foreground">Notice Date:</span>{" "}
            <span className="font-bold text-foreground">{noticeDate}</span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NoticeField label="Road Width Zone" value={taxZone.toUpperCase()} />
          <NoticeField label="Ward" value={`Ward ${survey.wardNo}`} />
          <NoticeField
            label="Annual Base Rate"
            value={notice.masterBaseRate ? `₹${formatAmountPlain(notice.masterBaseRate.annualRate)}/sqft` : "—"}
          />
          <NoticeField label={<BilingualLabel en="Unique ID" hi="यूनिक आईडी" />} value={propertyId} />
        </div>
        {notice.masterBaseRate && notice.rateSource !== "system" && (
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              Master data
            </Badge>
            Ward {notice.masterBaseRate.wardNo} · {notice.masterBaseRate.zoneLabel} ·{" "}
            {notice.masterBaseRate.constructionLabel} · ₹{formatAmountPlain(notice.masterBaseRate.annualRate)}/sqft/yr
            (₹{formatAmountPlain(notice.masterBaseRate.monthlyRate)}/sqft/mo reference)
          </p>
        )}
        {notice.totalAlv > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NoticeField label="Gross ALV" value={`₹${formatAmountPlain(notice.totalAlv)}`} />
            <NoticeField
              label={`Yearly Assessable (${(notice.assessableValuePct * 100).toFixed(0)}%)`}
              value={`₹${formatAmountPlain(notice.totalAssessableAlv)}`}
            />
            <NoticeField
              label="Property Tax Base"
              value={`${(notice.assessableValuePct * 100).toFixed(0)}% of gross ALV for tax calculation`}
            />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <NoticeField label="Property Owner" value={ownerName} />
          <NoticeField label="Address" value={address || "—"} />
        </div>

        <DemandNoticeFloorTable
          notice={notice}
          propertyTaxPct={rateConfig?.propertyTaxPct ?? DEFAULT_TAX_RATES.propertyTaxPct}
          waterTaxPct={rateConfig?.waterTaxPct ?? DEFAULT_TAX_RATES.waterTaxPct}
          drainageTaxPct={rateConfig?.drainageTaxPct ?? DEFAULT_TAX_RATES.drainageTaxPct}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <DemandNoticeSiteDocs survey={survey} frontPhoto={frontPhoto} />
          <DemandNoticeDemandSidebar notice={notice} rateConfig={rateConfig} />
        </div>

        <section className="space-y-3 border-t border-border/50 pt-6 text-sm leading-relaxed text-muted-foreground">
          <p className="text-foreground">
            Any objection to this assessment must be submitted in writing to the Executive Officer within{" "}
            <strong>15 days</strong> from the date of this notice. Failure to do so will result in the demand being
            considered final and recoverable as arrears.
          </p>
          <p>
            इस मूल्यांकन पर कोई भी आपत्ति इस नोटिस की तिथि से <strong>15 दिनों</strong> के भीतर कार्यकारी अधिकारी को
            लिखित रूप में प्रस्तुत की जानी चाहिए। ऐसा न करने पर मांग को अंतिम मानकर बकाया के रूप में वसूली जाएगी।
          </p>
        </section>

        <div className="flex justify-end pt-2">
          <div className="w-64 text-center">
            <div className="mb-2 h-12 border-b border-border" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Executive Officer</p>
            <p className="text-[11px] text-muted-foreground">Tax Collector Department</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/50 bg-muted/30 px-6 py-4 text-center sm:px-10">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Computer-generated demand notice issued by the Municipal Board. Property ID:{" "}
          <span className="font-mono font-semibold text-foreground">{propertyId}</span>
        </p>
      </footer>
    </article>
  );
}

function DemandNoticeFloorTable({
  notice,
  propertyTaxPct,
  waterTaxPct,
  drainageTaxPct,
}: {
  notice: DemandNoticeData;
  propertyTaxPct: number;
  waterTaxPct: number;
  drainageTaxPct: number;
}) {
  const effectivePct = (propertyTaxPct * 100).toFixed(1).replace(/\.0$/, "");
  const assessablePct = (notice.assessableValuePct * 100).toFixed(0);
  const taxOnAssessablePct = ((propertyTaxPct / notice.assessableValuePct) * 100).toFixed(1).replace(/\.0$/, "");
  const waterPerHundred = (waterTaxPct * 100).toFixed(1).replace(/\.0$/, "");
  const drainagePerHundred = (drainageTaxPct * 100).toFixed(1).replace(/\.0$/, "");

  return (
    <section>
      <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-[0.14em] text-brand-navy/70 dark:text-primary/80">
        <BilingualLabel en="Assessment Details" hi="मूल्यांकन विवरण" />
      </h2>
      <div className="premium-card overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-brand-navy/10 bg-brand-navy/5 hover:bg-brand-navy/5 dark:border-primary/15 dark:bg-primary/10">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  <BilingualLabel en="Floor" hi="तल" />
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  <BilingualLabel en="Usage" hi="उपयोग" />
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  <BilingualLabel en="Construction" hi="निर्माण" />
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">
                  Area (SqFt)
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">
                  Yearly Rate (₹/sqft/yr)
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">
                  Gross ALV (₹)
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">
                  Yearly Assessable ({assessablePct}%)
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Tax</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notice.floorRows.length > 0 ? (
                notice.floorRows.map((row, i) => (
                  <TableRow key={`${row.floorLabel}-${i}`} className="border-b border-border/40 text-sm">
                    <TableCell className="font-semibold">{row.floorLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{row.usageLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{row.constructionLabel}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatAmountPlain(row.areaSqft)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-xs">
                      <span className="inline-flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-1.5">
                          {formatAmountPlain(row.baseRate)}
                          {notice.rateSource !== "system" && (
                            <Badge
                              variant="outline"
                              className="h-4 px-1 text-[8px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                              title="Yearly rate from ward master data"
                            >
                              Master
                            </Badge>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ₹{formatAmountPlain(row.monthlyRate)}/mo ref
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmountPlain(row.alv)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {formatAmountPlain(row.assessableAlv)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatAmountPlain(row.tax)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No floor assessment data available
                  </TableCell>
                </TableRow>
              )}
              {notice.floorRows.length > 0 && (
                <TableRow className="border-t-2 border-brand-navy/20 bg-brand-navy/5 font-bold hover:bg-brand-navy/5 dark:border-primary/25 dark:bg-primary/10">
                  <TableCell colSpan={3} className="uppercase tracking-wide text-foreground">
                    Total Assessment
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatAmountPlain(notice.totalArea)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatAmountPlain(notice.totalAlv)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {formatAmountPlain(notice.totalAssessableAlv)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-base tabular-nums text-foreground">
                    ₹ {formatAmountPlain(notice.totalTax)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {notice.floorRows.length > 0 && (
          <p className="border-t border-border/50 bg-muted/15 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Formula:</span> Gross ALV = Area × yearly rate
            {notice.floorRows.some((r) => r.usageMult !== 1) && " × usage multiplier"} · Yearly Assessable = Gross ALV ×{" "}
            {assessablePct}% · Yearly assessable tax = Yearly Assessable ÷ 100 × {taxOnAssessablePct} ({effectivePct}%
            effective) · Water = Yearly Assessable ÷ 100 × {waterPerHundred} · Drainage = Yearly Assessable ÷ 100 ×{" "}
            {drainagePerHundred} · Yearly assessable + Water + Drainage = Total demand (yearly)
          </p>
        )}
      </div>
    </section>
  );
}

function DemandNoticeSiteDocs({ survey, frontPhoto }: { survey: SurveyDetail; frontPhoto?: string | null }) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-[0.14em] text-brand-navy/70 dark:text-primary/80">
        <BilingualLabel en="Site Documentation" hi="साइट प्रमाण" />
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NoticePhoto url={frontPhoto} label="Front View / सामने का दृश्य" />
        {survey.gps ? (
          <div className="print:hidden">
            <GoogleMapEmbed
              latitude={survey.gps.latitude}
              longitude={survey.gps.longitude}
              accuracyMeters={survey.gps.accuracyMeters}
              title="Location Map"
              className="h-full"
            />
          </div>
        ) : (
          <NoticePhoto url={survey.photos?.find((p) => p.slot === "side")?.url} label="Side View" />
        )}
      </div>
    </section>
  );
}

function pctLabel(val: number) {
  return `${(val * 100).toFixed(1)}%`;
}

function rateSourceCaption(notice: DemandNoticeData): string {
  const zone = notice.masterBaseRate?.zoneLabel;
  if (notice.rateSource === "ward") {
    return zone
      ? `Ward ${notice.masterBaseRate!.wardNo} · ${zone} · ward master data`
      : `Ward ${notice.masterBaseRate?.wardNo ?? "—"} · ward master data`;
  }
  if (notice.rateSource === "ulb") {
    return zone ? `${zone} · ULB master data` : "ULB master data";
  }
  return "System default rates";
}

function DemandNoticeDemandSidebar({
  notice,
  rateConfig,
}: {
  notice: DemandNoticeData;
  rateConfig?: { propertyTaxPct: number; waterTaxPct: number; drainageTaxPct: number } | null;
}) {
  const propPct = rateConfig ? pctLabel(rateConfig.propertyTaxPct) : pctLabel(DEFAULT_TAX_RATES.propertyTaxPct);
  const waterPct = rateConfig ? pctLabel(rateConfig.waterTaxPct) : "7%";
  const drainPct = rateConfig ? pctLabel(rateConfig.drainageTaxPct) : "2.5%";

  return (
    <section className="overflow-hidden rounded-xl border-2 border-brand-red/25 bg-brand-red/6 dark:border-brand-red/35 dark:bg-brand-red/10">
      <div className="border-b border-brand-red/20 px-4 py-3">
        <h2 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-brand-red">
          <BilingualLabel en="Demand Summary" hi="मांग सारांश" />
        </h2>
      </div>
      <ul className="divide-y divide-border/50 px-4">
        <li className="flex items-center justify-between py-3 text-sm">
          <span className="text-muted-foreground">Yearly Assessable</span>
          <span className="font-mono font-semibold tabular-nums">{formatInr(notice.propertyTax)}</span>
        </li>
        <li className="flex items-center justify-between py-3 text-sm">
          <span className="text-muted-foreground">Water</span>
          <span className="font-mono font-semibold tabular-nums">
            {notice.waterTax > 0 ? formatInr(notice.waterTax) : "—"}
          </span>
        </li>
        <li className="flex items-center justify-between py-3 text-sm">
          <span className="text-muted-foreground">Drainage</span>
          <span className="font-mono font-semibold tabular-nums">{formatInr(notice.drainageTax)}</span>
        </li>
      </ul>
      <div className="border-t border-brand-red/25 bg-brand-red/10 px-4 py-4 dark:bg-brand-red/15">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <BilingualLabel en="Total Demand (Yearly)" hi="कुल वार्षिक मांग" />
        </p>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatInr(notice.propertyTax)}
          {notice.waterTax > 0 ? ` + ${formatInr(notice.waterTax)}` : ""} + {formatInr(notice.drainageTax)} =
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-brand-red">
          {notice.totalAnnualDemand > 0 ? formatInr(notice.totalAnnualDemand) : "—"}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Yearly assessable + Water + Drainage = Total demand (yearly)
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground">{rateSourceCaption(notice)}</p>
      </div>
    </section>
  );
}

export function DemandNoticeFooterCards({
  survey,
  surveyId,
  cityName,
  taxZone,
  notice,
}: {
  survey: SurveyDetail;
  surveyId: string;
  cityName: string;
  taxZone: string;
  notice: DemandNoticeData;
}) {
  return (
    <div className="print-hidden grid gap-4 sm:grid-cols-2">
      {survey.gps && (
        <GlassCard padding="md" className="sm:col-span-2 lg:hidden">
          <GlassCardHeader
            title="Geo-Tagged Location"
            description="Survey GPS coordinates on Google Maps"
            icon={<MapPin className="h-4 w-4" aria-hidden />}
            className="mb-4"
          />
          <GoogleMapEmbed
            latitude={survey.gps.latitude}
            longitude={survey.gps.longitude}
            accuracyMeters={survey.gps.accuracyMeters}
          />
        </GlassCard>
      )}
      <GlassCard padding="md">
        <GlassCardHeader
          title="Assessment Reference"
          icon={<Layers className="h-4 w-4" aria-hidden />}
          className="mb-3"
        />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">ULB</dt>
            <dd className="font-medium text-foreground">{cityName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Zone</dt>
            <dd className="font-medium text-foreground">{taxZone}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Floors assessed</dt>
            <dd className="font-medium text-foreground">{notice.floorRows.length}</dd>
          </div>
        </dl>
      </GlassCard>
      <GlassCard padding="md">
        <GlassCardHeader
          title="Related Documents"
          icon={<FileText className="h-4 w-4" aria-hidden />}
          className="mb-3"
        />
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" size="sm" className="cursor-pointer justify-start rounded-xl">
            <Link href={`/qc/${surveyId}/report`}>
              <FileText className="h-4 w-4" aria-hidden /> QC Final Report
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="cursor-pointer justify-start rounded-xl">
            <Link href={`/qc/${surveyId}`}>
              <Camera className="h-4 w-4" aria-hidden /> QC Review
            </Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
