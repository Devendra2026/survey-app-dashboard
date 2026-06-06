"use client";

import { QcCorrectionBanner } from "@/components/qc/qc-correction-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { SurveyEditor } from "@/components/surveys/survey-editor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQcRemarks } from "@/hooks/qc/useQc";
import { useSubmitSurvey, useSurvey } from "@/hooks/surveys/useSurveys";
import { parseConvexError } from "@/lib/errors";
import { ArrowLeft, Eye } from "lucide-react";
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
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (survey === null) {
    return <EmptyState title="Survey not found" description="It may have been deleted or is outside your scope." />;
  }

  const locked = survey.qcStatus === "approved";
  const canSubmit = survey.status === "draft" || survey.qcStatus === "rejected" || survey.status === "submitted";
  const isResubmit = survey.qcStatus === "rejected";

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
      <div className="space-y-5">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit rounded-full border-primary/30 bg-primary/5 px-4 text-primary hover:bg-primary/10"
        >
          <Link href={`/surveys/${id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to detail
          </Link>
        </Button>

        <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-linear-to-r from-amber-50 via-orange-50 to-yellow-50 px-6 py-5 shadow-sm dark:border-amber-800/30 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-yellow-950/30">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl dark:bg-amber-500/10" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-orange-300/20 blur-2xl dark:bg-orange-500/10" />
          <PageHeader
            title={`Edit — ${survey.propertyId || `Parcel ${survey.parcelNo}`}`}
            description={`${survey.city} · Ward ${survey.wardNo} · Complete all tabs before submitting.`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <SurveyStatusBadge status={survey.status} />
                <QcStatusBadge status={survey.qcStatus} />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full border-amber-300 bg-white/80 text-amber-800 shadow-sm hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/30"
                >
                  <Link href={`/surveys/${id}`}>
                    <Eye className="h-4 w-4" /> View detail
                  </Link>
                </Button>
              </div>
            }
          />
        </div>

        {locked ? (
          <EmptyState
            title="Survey locked"
            description="This survey has been approved and can no longer be edited. Contact a supervisor to re-open it."
            action={
              <Button asChild variant="outline">
                <Link href={`/surveys/${id}`}>View detail</Link>
              </Button>
            }
          />
        ) : (
          <>
            {isResubmit && <QcCorrectionBanner remarks={remarks} />}
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
      </div>
    </RoleGate>
  );
}
