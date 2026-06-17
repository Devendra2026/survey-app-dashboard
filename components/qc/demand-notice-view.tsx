"use client";

import { PageTransition } from "@/components/design-system/motion";
import { DemandNoticeDocument } from "@/components/qc/demand-notice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMasters } from "@/hooks/masters/useMasters";
import { useDemandNoticePrintFit } from "@/hooks/qc/useDemandNoticePrintFit";
import { useTaxRatesForMunicipality } from "@/hooks/qc/useTaxRatesForMunicipality";
import { buildOfficeTitles, buildSurveyAddress, computeDemandNotice, formatNoticeDate } from "@/lib/qc/demand-notice";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import type { SurveyDetail } from "@/schema/surveys/index";
import { ArrowLeft, Printer } from "lucide-react";
import { Geist, JetBrains_Mono, Noto_Sans_Devanagari } from "next/font/google";
import Link from "next/link";

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

type DemandNoticeViewProps = {
  survey: SurveyDetail;
  surveyId: string;
  backHref?: string;
};

export function DemandNoticeView({ survey, surveyId, backHref = `/qc/${surveyId}/report` }: DemandNoticeViewProps) {
  const { masters } = useMasters();
  const { rateConfig, ratesLoading } = useTaxRatesForMunicipality(survey.municipalityId);
  const { printNotice } = useDemandNoticePrintFit();

  const ulbCodes = buildUlbCodeMap(masters?.ulbs);
  const propertyId = resolveDisplayPropertyId(survey, ulbCodes) ?? survey.propertyId ?? survey.parcelNo;
  const primaryOwner = survey.owners?.[0];
  const ownerName = survey.respondentName || primaryOwner?.name || "—";
  const fatherName = primaryOwner?.fatherOrHusbandName?.trim() || "—";
  const mobileNo = primaryOwner?.mobileNo?.trim() || survey.mobileNo?.trim() || "—";
  const oldHouseNo = survey.oldPropertyNo?.trim() || "—";
  const ulb = masters?.ulbs?.find((m) => m._id === survey.municipalityId);
  const district = masters?.districts?.find((d) => d._id === survey.districtId);
  const cityName = ulb?.name ?? survey.city ?? "—";
  const districtName = district?.name ?? "—";
  const stateName = district?.stateName ?? ulb?.stateName ?? "Uttar Pradesh";
  const office = buildOfficeTitles(cityName, stateName, ulb?.bodyType, districtName);
  const taxZone = labelFromOptions(masters?.taxRateZones, survey.taxRateZone) || survey.taxRateZone || "—";
  const address = buildSurveyAddress(survey);
  const notice =
    rateConfig !== undefined
      ? computeDemandNotice(survey, survey.floors ?? [], masters ?? undefined, rateConfig)
      : null;
  const noticeDate = formatNoticeDate(survey.submittedAt ?? Date.now());
  const assessmentYear = survey.assessmentYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const frontPhoto = survey.photos?.find((p) => p.slot === "front")?.url;
  const sidePhoto = survey.photos?.find((p) => p.slot === "side")?.url;

  if (ratesLoading || !notice) {
    return (
      <PageTransition
        className={`demand-notice ${notoDevanagari.variable} ${geist.variable} bg-slate-50 ${jetbrainsMono.variable}`}
      >
        <div className="print-hidden sticky top-4 z-40 mx-auto flex w-full max-w-480 flex-col gap-3 rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="outline" size="sm" className="w-fit cursor-pointer rounded-xl">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QC Report
            </Link>
          </Button>
        </div>
        <div className="mx-auto w-full max-w-480 space-y-4 rounded-2xl border border-zinc-200 bg-white p-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <div className="grid gap-3 pt-4 sm:grid-cols-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <p className="text-center text-sm text-muted-foreground">Loading ward rates from master data…</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition
      className={`demand-notice ${notoDevanagari.variable} ${geist.variable} bg-slate-50 ${jetbrainsMono.variable}`}
    >
      <div className="print-hidden sticky top-4 z-40 mx-auto flex w-full max-w-480 flex-col gap-3 rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline" size="sm" className="w-fit cursor-pointer rounded-xl">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QC Report
          </Link>
        </Button>
        <div className="min-w-0 flex-1 text-center sm:px-2">
          <p className="truncate text-sm font-semibold text-zinc-900">Property Tax Demand Notice</p>
          <p className="truncate font-mono text-xs text-zinc-500">{propertyId}</p>
        </div>
        <div className="flex flex-col items-end gap-1 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-fit cursor-pointer rounded-xl"
            onClick={() => void printNotice()}
          >
            <Printer className="h-4 w-4" aria-hidden /> Print Notice
          </Button>
          <p className="max-w-56 text-right text-[10px] leading-snug text-zinc-500">
            Use A4, scale 100%, minimum margins, headers off.
          </p>
        </div>
      </div>

      <div className="demand-notice-canvas demand-notice-fullpage mx-auto w-full max-w-480 px-6 pb-8 print:max-w-none print:px-0">
        <DemandNoticeDocument
          survey={survey}
          propertyId={propertyId}
          ownerName={ownerName}
          fatherName={fatherName}
          mobileNo={mobileNo}
          oldHouseNo={oldHouseNo}
          office={office}
          taxZone={taxZone}
          address={address}
          notice={notice}
          noticeDate={noticeDate}
          assessmentYear={assessmentYear}
          frontPhoto={frontPhoto}
          sidePhoto={sidePhoto}
          rateConfig={rateConfig}
        />
      </div>
    </PageTransition>
  );
}
