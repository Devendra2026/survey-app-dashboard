"use client";

import type { DemandNoticeData, OfficeTitles } from "@/lib/qc/demand-notice";
import { DEFAULT_TAX_RATES } from "@/lib/qc/tax-rate-defaults";
import type { SurveyDetail } from "@/schema/surveys/index";
import { NoticeAssessmentTable } from "./notice-assessment-table";
import { NoticeDemandSummary } from "./notice-demand-summary";
import { NoticeHeader } from "./notice-header";
import { NoticeLegalBlock } from "./notice-legal-block";
import { NoticePhotoGallery } from "./notice-photo-gallery";
import { NoticePropertyCodes } from "./notice-property-codes";
import { NoticePropertyGrid } from "./notice-property-grid";
import { DemandNoticeBody, DemandNoticeSheet } from "./notice-sheet";
import { NoticeSignatureBlock, NoticeSignatureBlockScreen } from "./notice-signature-block";
import { NoticeWatermark } from "./notice-watermark";
import { pctLabel } from "./shared";

export type DemandNoticeDocumentProps = {
  survey: SurveyDetail;
  propertyId: string;
  ownerName: string;
  fatherName: string;
  mobileNo: string;
  oldHouseNo: string;
  office: OfficeTitles;
  taxZone: string;
  address: string;
  notice: DemandNoticeData;
  noticeDate: string;
  assessmentYear: string;
  frontPhoto?: string | null;
  sidePhoto?: string | null;
  logoUrl?: string | null;
  rateConfig?: { propertyTaxPct: number; waterTaxPct: number; drainageTaxPct: number } | null;
};

export function DemandNoticeDocument({
  survey,
  propertyId,
  ownerName,
  fatherName,
  mobileNo,
  oldHouseNo,
  office,
  taxZone,
  address,
  notice,
  noticeDate,
  assessmentYear,
  frontPhoto,
  sidePhoto,
  logoUrl,
  rateConfig,
}: DemandNoticeDocumentProps) {
  const propPct = rateConfig ? pctLabel(rateConfig.propertyTaxPct) : pctLabel(DEFAULT_TAX_RATES.propertyTaxPct);
  const waterPct = rateConfig ? pctLabel(rateConfig.waterTaxPct) : "7%";
  const drainPct = rateConfig ? pctLabel(rateConfig.drainageTaxPct) : "2.5%";

  return (
    <DemandNoticeSheet floorCount={notice.floorRows.length}>
      <NoticeWatermark ulbName={office.ulbName} />
      <NoticeHeader
        office={office}
        propertyId={propertyId}
        assessmentYear={assessmentYear}
        noticeDate={noticeDate}
        logoUrl={logoUrl}
      />
      <DemandNoticeBody>
        <NoticePropertyGrid
          survey={survey}
          propertyId={propertyId}
          ownerName={ownerName}
          fatherName={fatherName}
          mobileNo={mobileNo}
          oldHouseNo={oldHouseNo}
          taxZone={taxZone}
          address={address}
          notice={notice}
        />
        <div className="demand-notice-media-row flex flex-col gap-[var(--dn-space-4)] lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
          <NoticePhotoGallery survey={survey} frontPhoto={frontPhoto} sidePhoto={sidePhoto} />
          <NoticeDemandSummary notice={notice} propPct={propPct} waterPct={waterPct} drainPct={drainPct} />
        </div>
        <NoticeAssessmentTable
          notice={notice}
          propertyTaxPct={rateConfig?.propertyTaxPct ?? DEFAULT_TAX_RATES.propertyTaxPct}
          waterTaxPct={rateConfig?.waterTaxPct ?? DEFAULT_TAX_RATES.waterTaxPct}
          drainageTaxPct={rateConfig?.drainageTaxPct ?? DEFAULT_TAX_RATES.drainageTaxPct}
        />
        <NoticeLegalBlock />
        <NoticeSignatureBlockScreen />
        <div className="demand-notice-print-footer">
          <NoticeSignatureBlock />
          <NoticePropertyCodes propertyId={propertyId} />
          <p className="demand-notice-print-only demand-notice-print-caption text-center text-[var(--dn-secondary)]">
            Computer-generated demand notice issued by the Municipal Board. Property ID:{" "}
            <span className="font-mono font-semibold text-[var(--dn-primary)]">{propertyId}</span>
          </p>
        </div>
      </DemandNoticeBody>
      <footer className="demand-notice-print-hide relative z-[1] border-t border-[var(--dn-border)] bg-[var(--dn-surface)] px-6 py-3 text-center">
        <p className="text-[11px] leading-relaxed text-[var(--dn-secondary)]">
          Computer-generated demand notice issued by the Municipal Board. Property ID:{" "}
          <span className="font-mono font-semibold text-[var(--dn-primary)]">{propertyId}</span>
        </p>
      </footer>
    </DemandNoticeSheet>
  );
}
