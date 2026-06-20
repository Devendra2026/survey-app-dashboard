"use client";

import { PageTransition } from "@/components/design-system/motion";
import { QcActionBar } from "@/components/qc/qc-action-bar";
import { QcParcelSiblingsPanel } from "@/components/qc/qc-parcel-siblings-panel";
import { QcPropertyIdConflictPanel } from "@/components/qc/qc-property-id-conflict-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { QcPageSkeleton } from "@/components/shared/qc-route-skeleton";
import { RoleGate } from "@/components/shared/role-gate";
import { QcReviewDetailView } from "@/components/surveys/survey-detail-view";
import { SurveyViewHero } from "@/components/surveys/survey-view-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { useQcPendingQueue } from "@/hooks/qc/useQcPendingQueue";
import { useQcWorkScope } from "@/hooks/qc/useQcWorkScope";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import { isSurveyAwaitingQc, wasEditedAfterSubmit } from "@/lib/domain";
import { findNextPendingSurvey } from "@/lib/qc/queue-nav";
import { scopeFromSurveyRow } from "@/lib/qc/work-scope";
import { ArrowLeft, Building2, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Suspense, use, useMemo } from "react";

function QcReviewBody({ id }: { id: string }) {
  const survey = useSurvey(id);
  useQcWorkScope(survey);
  const workScope = useMemo(() => (survey ? scopeFromSurveyRow(survey) : {}), [survey]);
  const pendingQueue = useQcPendingQueue(workScope, !!survey);

  const nextSurvey = useMemo(() => findNextPendingSurvey(pendingQueue, id), [pendingQueue, id]);

  if (survey === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (survey === null) return <EmptyState title="Survey not found" />;

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control review is available to supervisors and administrators."
    >
      <PageTransition className="space-y-6 pb-28">
        <Link
          href="/qc"
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QC queue
        </Link>

        <SurveyViewHero survey={survey} surveyId={id} canEdit={false} title="QC Review" icon={ClipboardCheck} />

        {survey.qcStatus === "approved" && (
          <output className="block rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100">
            This survey is approved. Use <strong>Reopen for review</strong> in the action bar if the data is incorrect.
          </output>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isSurveyAwaitingQc(survey) && wasEditedAfterSubmit(survey) && (
            <span className="rounded-full border border-amber-400/50 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-950 dark:text-amber-100">
              Updated since submit
            </span>
          )}
          {survey.surveyor?.name && (
            <span className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              <Building2 className="h-3 w-3" aria-hidden />
              Surveyor: {survey.surveyor.name}
            </span>
          )}
        </div>

        <QcPropertyIdConflictPanel surveyId={id} propertyId={survey.propertyId} />

        <QcParcelSiblingsPanel
          surveyId={id}
          wardNo={survey.wardNo}
          parcelNo={survey.parcelNo}
          currentSurvey={{
            _id: survey._id,
            wardNo: survey.wardNo,
            parcelNo: survey.parcelNo,
            unitNo: survey.unitNo,
            propertyUse: survey.propertyUse,
            propertyId: survey.propertyId,
            respondentName: survey.respondentName,
            owners: survey.owners,
            qcStatus: survey.qcStatus,
            status: survey.status,
          }}
        />

        <QcReviewDetailView survey={survey} surveyId={id} />

        <QcActionBar survey={survey} nextSurvey={nextSurvey} scope={workScope} mode="review" />
      </PageTransition>
    </RoleGate>
  );
}

export default function QcReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<QcPageSkeleton variant="review" />}>
      <QcReviewBody key={id} id={id} />
    </Suspense>
  );
}
