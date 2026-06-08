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
import { useSubmitSurvey, useSurvey } from "@/hooks/surveys/useSurveys";
import {
  canSubmitSurvey,
  isSurveyAwaitingQc,
  isSurveyResubmit,
  needsQcSaveBar,
  wasEditedAfterSubmit,
} from "@/lib/domain";
import { convexValidationSummary } from "@/lib/errors";
import { useCurrentUser } from "@/lib/session";
import { ArrowLeft, Eye, PencilLine } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useState } from "react";
import { toast } from "sonner";

function SurveyEditPageSkeleton() {
  return (
    <PageTransition className="space-y-6">
      <Skeleton className="h-9 w-36 rounded-xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </PageTransition>
  );
}

function SurveyEditPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQc = searchParams.get("from") === "qc";
  const survey = useSurvey(id);
  const remarks = useQcRemarks(id);
  const submitSurvey = useSubmitSurvey();
  const { role } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);

  if (survey === undefined) {
    return <SurveyEditPageSkeleton />;
  }

  if (survey === null) {
    return <EmptyState title="Survey not found" description="It may have been deleted or is outside your scope." />;
  }

  const locked = survey.qcStatus === "approved";
  const canSubmit = canSubmitSurvey(survey);
  const isResubmit = isSurveyResubmit(survey);
  const awaitingQc = isSurveyAwaitingQc(survey);
  const isQcReviewer = role === "supervisor" || role === "admin";
  const qcEditMode = fromQc && isQcReviewer && needsQcSaveBar(survey);
  const propertyLabel = survey.propertyId || `Parcel ${survey.parcelNo}`;
  const backHref = fromQc ? `/qc/${id}` : `/surveys/${id}`;

  async function onSubmit() {
    setSubmitting(true);
    try {
      await submitSurvey({ id: id as any });
      toast.success("Survey submitted for QC");
      router.push(`/surveys/${id}`);
    } catch (e) {
      toast.error(convexValidationSummary(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RoleGate mode="page" capability="surveys.editDraft" deniedDescription="You don't have permission to edit surveys.">
      <PageTransition className="space-y-6 lg:space-y-8">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit cursor-pointer rounded-xl border-border/70 bg-card/80 px-4 shadow-premium-sm backdrop-blur-sm hover:bg-muted/40"
        >
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {fromQc ? "Back to QC review" : "Back to detail"}
          </Link>
        </Button>

        <ExecutiveHero
          eyebrow={qcEditMode ? "QC Correction" : "Survey Edit"}
          title={propertyLabel}
          description={
            qcEditMode
              ? `${survey.city} · Ward ${survey.wardNo} — fix data, save corrections, then approve from QC review.`
              : `${survey.city} · Ward ${survey.wardNo} — complete all tabs before submitting for QC.`
          }
          icon={PencilLine}
          gradient="brand"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <SurveyStatusBadge status={survey.status} />
              <QcStatusBadge status={survey.qcStatus} />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="cursor-pointer rounded-xl border-brand-navy/25 bg-card/80 shadow-premium-sm hover:bg-brand-navy/5 dark:border-primary/30"
              >
                <Link href={`/surveys/${id}`}>
                  <Eye className="h-4 w-4" aria-hidden /> View detail
                </Link>
              </Button>
            </div>
          }
        />

        {locked ? (
          <EmptyState
            title="Survey locked"
            description="This survey has been approved and can no longer be edited. Contact a supervisor to re-open it."
            action={
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/surveys/${id}`}>View detail</Link>
              </Button>
            }
          />
        ) : (
          <>
            {isResubmit && <QcCorrectionBanner remarks={remarks} />}
            {awaitingQc && (
              <output className="block rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                {isQcReviewer ? (
                  <>
                    This survey is in the QC queue. Save corrections here — it stays submitted for review
                    {wasEditedAfterSubmit(survey) ? " (updated since last submit)" : ""}. Approve or return from the QC
                    review screen when done.
                  </>
                ) : (
                  <>
                    This survey is awaiting QC review. You can save edits, but it cannot be re-submitted until QC
                    returns it for correction.
                  </>
                )}
              </output>
            )}
            <SurveyEditor
              localId={survey.localId}
              surveyId={id}
              existing={survey}
              showSaveBar={needsQcSaveBar(survey)}
              saveBarLabel="Save corrections"
              saveBarDescription="Saves property details and plot area. The survey stays submitted for QC — approve or return from the QC review screen."
              saveBarSecondaryAction={
                fromQc ? (
                  <Button asChild variant="outline" className="cursor-pointer rounded-xl">
                    <Link href={`/qc/${id}`}>Return to QC review</Link>
                  </Button>
                ) : undefined
              }
              showSubmitBar={canSubmit}
              onSubmit={onSubmit}
              submitting={submitting}
              submitLabel={isResubmit ? "Save & Re-submit to QC" : undefined}
            />
          </>
        )}
      </PageTransition>
    </RoleGate>
  );
}

export default function SurveyEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<SurveyEditPageSkeleton />}>
      <SurveyEditPageContent params={params} />
    </Suspense>
  );
}
