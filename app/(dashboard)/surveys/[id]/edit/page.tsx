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
import { canSubmitSurvey, isSurveyResubmit } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import { ArrowLeft, Eye, PencilLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

export default function SurveyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const survey = useSurvey(id);
  const remarks = useQcRemarks(id);
  const submitSurvey = useSubmitSurvey();
  const [submitting, setSubmitting] = useState(false);

  if (survey === undefined) {
    return (
      <PageTransition className="space-y-6">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </PageTransition>
    );
  }

  if (survey === null) {
    return <EmptyState title="Survey not found" description="It may have been deleted or is outside your scope." />;
  }

  const locked = survey.qcStatus === "approved";
  const canSubmit = canSubmitSurvey(survey);
  const isResubmit = isSurveyResubmit(survey);
  const awaitingQc = survey.status === "submitted" && survey.qcStatus === "pending";
  const propertyLabel = survey.propertyId || `Parcel ${survey.parcelNo}`;

  async function onSubmit() {
    if (!confirm("Submit this survey for QC review? You won't be able to edit it until it's reviewed.")) return;
    setSubmitting(true);
    try {
      await submitSurvey({ id: id as any });
      toast.success("Survey submitted for QC");
      router.push(`/surveys/${id}`);
    } catch (e) {
      toast.error(parseConvexError(e).message);
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
          <Link href={`/surveys/${id}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to detail
          </Link>
        </Button>

        <ExecutiveHero
          eyebrow="Survey Edit"
          title={propertyLabel}
          description={`${survey.city} · Ward ${survey.wardNo} — complete all tabs before submitting for QC.`}
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
                This survey is awaiting QC review. You can save edits, but it cannot be submitted again until QC returns
                it for correction.
              </output>
            )}
            <SurveyEditor
              localId={survey.localId}
              surveyId={id}
              existing={survey}
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
