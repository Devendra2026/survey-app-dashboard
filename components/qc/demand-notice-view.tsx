"use client";

import { ExecutiveHero } from "@/components/design-system/executive-hero";
import { FadeIn, PageTransition } from "@/components/design-system/motion";
import {
  DemandNoticeDocument,
  DemandNoticeFooterCards,
  DemandNoticeKpiStrip,
} from "@/components/qc/demand-notice-sections";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useMasters } from "@/hooks/masters/useMasters";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { buildOfficeTitles, buildSurveyAddress, computeDemandNotice, formatNoticeDate } from "@/lib/qc/demand-notice";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import type { SurveyDetail } from "@/schema/surveys/index";
import { useQuery } from "convex/react";
import { ArrowLeft, ChevronRight, Printer, Receipt } from "lucide-react";
import Link from "next/link";

type DemandNoticeViewProps = {
  survey: SurveyDetail;
  surveyId: string;
  backHref?: string;
};

export function DemandNoticeView({ survey, surveyId, backHref = `/qc/${surveyId}/report` }: DemandNoticeViewProps) {
  const ready = useConvexAuthReady();
  const { masters } = useMasters();
  const {
    rateMatrix,
    wardRates,
    propertyTaxPct,
    waterTaxPct,
    drainageTaxPct,
    usageMultipliers,
  } = useQuery(
    api.taxRates.getForMunicipality,
    ready ? { municipalityId: survey.municipalityId } : "skip",
  ) ?? {};

  const dynamicRates =
    rateMatrix !== undefined
      ? { rateMatrix, wardRates, propertyTaxPct, waterTaxPct, drainageTaxPct, usageMultipliers }
      : undefined;

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
  const rateConfig =
    dynamicRates !== undefined && dynamicRates !== null
      ? {
          rateMatrix: dynamicRates.rateMatrix,
          wardRates: dynamicRates.wardRates,
          propertyTaxPct: dynamicRates.propertyTaxPct,
          waterTaxPct: dynamicRates.waterTaxPct,
          drainageTaxPct: dynamicRates.drainageTaxPct,
          usageMultipliers: dynamicRates.usageMultipliers,
        }
      : dynamicRates === null
        ? null
        : undefined;

  const ratesLoading = dynamicRates === undefined;
  const notice =
    rateConfig !== undefined
      ? computeDemandNotice(survey, survey.floors ?? [], masters ?? undefined, rateConfig)
      : null;
  const noticeDate = formatNoticeDate(survey.submittedAt ?? Date.now());
  const assessmentYear = survey.assessmentYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const frontPhoto = survey.photos?.find((p) => p.slot === "front")?.url;

  if (ratesLoading || !notice) {
    return (
      <PageTransition className="demand-notice space-y-6 lg:space-y-8">
        <div className="print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="outline" size="sm" className="w-fit cursor-pointer rounded-xl">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QC Report
            </Link>
          </Button>
        </div>
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-8">
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
    <PageTransition className="demand-notice space-y-6 lg:space-y-8">
      <div className="print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline" size="sm" className="w-fit cursor-pointer rounded-xl">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QC Report
          </Link>
        </Button>
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/qc" className="cursor-pointer font-medium transition-colors duration-200 hover:text-foreground">
            QC Workflow
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <Link
            href={`/qc/${surveyId}/report`}
            className="cursor-pointer font-medium transition-colors duration-200 hover:text-foreground"
          >
            Final Report
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="font-semibold text-foreground">Demand Notice</span>
        </nav>
      </div>

      <FadeIn>
        <ExecutiveHero
          eyebrow="Tax Demand Notice"
          title="Annual Property Tax Assessment"
          description={`${propertyId} · ${ownerName} · ${cityName}, ${stateName}`}
          icon={Receipt}
          gradient="brand"
          actions={
            <Button
              variant="outline"
              size="sm"
              className="print-hidden cursor-pointer rounded-xl"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" aria-hidden /> Print Notice
            </Button>
          }
        />
      </FadeIn>

      <DemandNoticeKpiStrip
        notice={notice}
        noticeDate={noticeDate}
        assessmentYear={assessmentYear}
        propertyTaxPct={rateConfig?.propertyTaxPct}
      />

      <FadeIn delay={0.06}>
        <DemandNoticeDocument
          survey={survey}
          propertyId={propertyId}
          ownerName={ownerName}
          office={office}
          taxZone={taxZone}
          address={address}
          notice={notice}
          noticeDate={noticeDate}
          assessmentYear={assessmentYear}
          frontPhoto={frontPhoto}
          rateConfig={rateConfig}
        />
      </FadeIn>

      <DemandNoticeFooterCards
        survey={survey}
        surveyId={surveyId}
        cityName={cityName}
        taxZone={taxZone}
        notice={notice}
      />
    </PageTransition>
  );
}
