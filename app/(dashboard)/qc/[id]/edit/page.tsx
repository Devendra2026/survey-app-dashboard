"use client";

import { ExecutiveHero } from "@/components/design-system/executive-hero";
import { PageTransition } from "@/components/design-system/motion";
import { QcCorrectionBanner } from "@/components/qc/qc-correction-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { SurveyEditor } from "@/components/surveys/survey-editor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQcRemarks } from "@/hooks/qc/useQc";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import {
  canUserEditSurvey,
  isSurveyAwaitingQc,
  isSurveyResubmit,
  needsQcSaveBar,
  wasEditedAfterSubmit,
} from "@/lib/domain";
import { useCurrentUser } from "@/lib/session";
import { ArrowLeft, ClipboardCheck, Eye } from "lucide-react";
import Link from "next/link";
import { use } from "react";

function QcEditPageSkeleton() {
  return (
    <PageTransition className="space-y-6">
      <Skeleton className="h-9 w-36 rounded-xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </PageTransition>
  );
}

export default function QcEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const survey = useSurvey(id);
  const remarks = useQcRemarks(id);
  const { role, capabilities } = useCurrentUser();

  if (survey === undefined) return <QcEditPageSkeleton />;
  if (survey === null) {
    return <EmptyState title="Survey not found" description="It may have been deleted or is outside your scope." />;
  }

  const propertyLabel = survey.propertyId || `Parcel ${survey.parcelNo}`;
  const canEdit = canUserEditSurvey(survey, { role, capabilities });
  const awaitingQc = isSurveyAwaitingQc(survey);
  const isResubmit = isSurveyResubmit(survey);

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control editing is available to QC supervisors and administrators."
    >
      <PageTransition className="space-y-6 lg:space-y-8">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit cursor-pointer rounded-xl border-amber-300/60 bg-card/80 px-4 shadow-premium-sm backdrop-blur-sm hover:bg-amber-500/10 dark:border-amber-700/50"
        >
          <Link href={`/qc/${id}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QC review
          </Link>
        </Button>

        <ExecutiveHero
          eyebrow="QC Correction"
          title={propertyLabel}
          description={`${survey.city} · Ward ${survey.wardNo} — verify data, save corrections, then approve from the review screen.`}
          icon={ClipboardCheck}
          gradient="amber"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <SurveyStatusBadge status={survey.status} />
              <QcStatusBadge status={survey.qcStatus} />
              <Button asChild variant="outline" size="sm" className="cursor-pointer rounded-xl">
                <Link href={`/qc/${id}`}>
                  <Eye className="h-4 w-4" aria-hidden /> Review &amp; approve
                </Link>
              </Button>
            </div>
          }
        />

        {!canEdit ? (
          <EmptyState
            title="Cannot edit in current state"
            description={
              survey.qcStatus === "approved"
                ? "This survey is approved and locked. Reopen it from the QC review screen if further changes are needed."
                : "This survey must be submitted before QC corrections can be applied."
            }
            action={
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/qc/${id}`}>Return to QC review</Link>
              </Button>
            }
          />
        ) : (
          <>
            {isResubmit && <QcCorrectionBanner remarks={remarks} />}
            {awaitingQc && (
              <output className="block rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                Save corrections here — the survey stays in the QC queue
                {wasEditedAfterSubmit(survey) ? " (updated since last submit)" : ""}. Return to review when ready to
                approve or return to the surveyor.
              </output>
            )}
            <SurveyEditor
              localId={survey.localId}
              surveyId={id}
              existing={survey}
              showSaveBar={needsQcSaveBar(survey) || survey.status === "draft"}
              saveBarLabel="Save QC corrections"
              saveBarDescription="Updates the survey record in place. Approve or return from the QC review screen when verification is complete."
              saveBarSecondaryAction={
                <Button asChild variant="outline" className="cursor-pointer rounded-xl">
                  <Link href={`/qc/${id}`}>Return to QC review</Link>
                </Button>
              }
              showSubmitBar={false}
            />
          </>
        )}
      </PageTransition>
    </RoleGate>
  );
}
