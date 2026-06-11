"use client";

import { ExecutiveHero } from "@/components/design-system/executive-hero";
import { PageTransition } from "@/components/design-system/motion";
import { QcReviewTimeline } from "@/components/design-system/qc-pipeline";
import { QcPanel } from "@/components/qc/qc-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { SurveyDetailView } from "@/components/surveys/survey-detail-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import { isSurveyAwaitingQc, wasEditedAfterSubmit } from "@/lib/domain";
import { ArrowLeft, Building2, ClipboardCheck, ExternalLink, FileText, MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function QcReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const survey = useSurvey(id);

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

  const timeline = [
    { id: "draft", label: "Draft created", timestamp: survey._creationTime, status: "done" as const },
    {
      id: "submitted",
      label: "Submitted for QC",
      timestamp: survey.submittedAt,
      status: survey.status === "submitted" || survey.qcStatus !== "pending" ? ("done" as const) : ("pending" as const),
    },
    {
      id: "review",
      label: "QC review in progress",
      status: survey.qcStatus === "pending" ? ("current" as const) : ("done" as const),
    },
    {
      id: "decision",
      label:
        survey.qcStatus === "approved" ? "Approved" : survey.qcStatus === "rejected" ? "Returned" : "Awaiting decision",
      status: survey.qcStatus === "pending" ? ("pending" as const) : ("done" as const),
    },
  ];

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control review is available to supervisors and administrators."
    >
      <PageTransition className="space-y-6">
        <Button asChild variant="outline" size="sm" className="w-fit cursor-pointer rounded-xl">
          <Link href="/qc">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QC queue
          </Link>
        </Button>

        <ExecutiveHero
          eyebrow="QC Review"
          title={survey.propertyId || `Parcel ${survey.parcelNo}`}
          description={[survey.city && `Ward ${survey.wardNo}, ${survey.city}`, survey.surveyor?.name]
            .filter(Boolean)
            .join(" · ")}
          icon={ClipboardCheck}
          gradient="amber"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="cursor-pointer rounded-xl">
                <Link href={`/qc/${id}/report`}>
                  <FileText className="h-4 w-4" aria-hidden /> QC Report
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="cursor-pointer rounded-xl">
                <Link href={`/surveys/${id}`}>
                  <ExternalLink className="h-4 w-4" aria-hidden /> Survey detail
                </Link>
              </Button>
              {survey.qcStatus !== "approved" && (
                <RoleGate anyOf={["surveys.editDraft", "qc.review"]} fallback={null}>
                  <Button asChild size="sm" variant="outline" className="cursor-pointer rounded-xl">
                    <Link href={`/surveys/${id}/edit?from=qc`}>
                      <Pencil className="h-4 w-4" aria-hidden /> Edit &amp; correct
                    </Link>
                  </Button>
                </RoleGate>
              )}
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <SurveyStatusBadge status={survey.status} />
          <QcStatusBadge status={survey.qcStatus} />
          {isSurveyAwaitingQc(survey) && wasEditedAfterSubmit(survey) && (
            <span className="rounded-full border border-amber-400/50 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-950 dark:text-amber-100">
              Updated since submit
            </span>
          )}
          {survey.city && (
            <span className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              <MapPin className="h-3 w-3" aria-hidden />
              {survey.city} · Ward {survey.wardNo}
            </span>
          )}
          {survey.surveyor?.name && (
            <span className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              <Building2 className="h-3 w-3" aria-hidden />
              {survey.surveyor.name}
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SurveyDetailView survey={survey} surveyId={id} hideProgressFooter hideQcRemarks />
          </div>
          <div className="space-y-4">
            <QcReviewTimeline events={timeline} />
            <QcPanel survey={survey} />
          </div>
        </div>
      </PageTransition>
    </RoleGate>
  );
}
