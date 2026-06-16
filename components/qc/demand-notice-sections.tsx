"use client";

import { SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { DemandNoticeDocument, type DemandNoticeDocumentProps } from "@/components/qc/demand-notice";
import { GoogleMapEmbed } from "@/components/shared/google-map-embed";
import { Button } from "@/components/ui/button";
import { formatAmountPlain, formatInr, type DemandNoticeData } from "@/lib/qc/demand-notice";
import type { SurveyDetail } from "@/schema/surveys/index";
import { Building2, Camera, FileText, Layers, MapPin, Receipt, Ruler, Scale } from "lucide-react";
import Link from "next/link";

export { BilingualLabel } from "@/components/qc/demand-notice";
export { DemandNoticeDocument, type DemandNoticeDocumentProps };

export function DemandNoticeKpiStrip({
  notice,
  noticeDate,
  assessmentYear,
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
            hint="property tax + water + drainage"
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
            label="Property Tax"
            value={notice.propertyTax > 0 ? formatInr(notice.propertyTax) : "—"}
            hint="yearly assessable tax"
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
