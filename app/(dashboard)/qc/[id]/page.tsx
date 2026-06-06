"use client";

import { QcPanel } from "@/components/qc/qc-panel";
import { generateQcReportPdf } from "@/components/reports/queries/pdf";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { SurveyDetailView } from "@/components/surveys/survey-detail-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQcRemarks } from "@/hooks/qc/useQc";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import { ArrowLeft, Building2, ClipboardCheck, Download, ExternalLink, MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function QcReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const survey = useSurvey(id);
  const remarks = useQcRemarks(id);

  if (survey === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (survey === null) return <EmptyState title="Survey not found" />;

  const canReview = survey.qcStatus === "pending" && survey.status === "submitted";

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control review is available to supervisors and administrators."
    >
      <div className="space-y-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit rounded-full border-amber-300/60 bg-amber-50/80 px-4 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/30"
        >
          <Link href="/qc">
            <ArrowLeft className="h-4 w-4" /> Back to QC queue
          </Link>
        </Button>

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-linear-to-r from-amber-50 via-orange-50 to-yellow-50 px-6 py-6 shadow-sm dark:border-amber-800/30 dark:from-amber-950/60 dark:via-orange-950/50 dark:to-yellow-950/40">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-28 w-28 rounded-full bg-orange-300/20 blur-2xl dark:bg-orange-500/10" />

          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/60">
                  <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700/80 dark:text-amber-400/70">
                  QC Review
                </span>
              </div>
              <h1 className="font-mono text-2xl font-black tracking-tight text-amber-950 dark:text-amber-50">
                {survey.propertyId || `Parcel ${survey.parcelNo}`}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <SurveyStatusBadge status={survey.status} />
                <QcStatusBadge status={survey.qcStatus} />
                {survey.city && (
                  <span className="flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/40">
                    <MapPin className="h-3 w-3" />
                    {survey.city} · Ward {survey.wardNo}
                  </span>
                )}
                {survey.surveyor?.name && (
                  <span className="flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/40">
                    <Building2 className="h-3 w-3" />
                    {survey.surveyor.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateQcReportPdf(survey, remarks ?? [])}
                className="rounded-full border-amber-300 bg-white/80 text-amber-800 shadow-sm hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/30"
              >
                <Download className="h-4 w-4" /> QC PDF
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full border-amber-300 bg-white/80 text-amber-800 shadow-sm hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/30"
              >
                <Link href={`/surveys/${id}`}>
                  <ExternalLink className="h-4 w-4" /> Survey detail
                </Link>
              </Button>
              {survey.qcStatus !== "approved" && (
                <RoleGate capability="surveys.editDraft" fallback={null}>
                  <Button
                    asChild
                    size="sm"
                    className="rounded-full bg-linear-to-r from-amber-600 to-orange-600 text-white shadow-sm hover:from-amber-500 hover:to-orange-500"
                  >
                    <Link href={`/surveys/${id}/edit`}>
                      <Pencil className="h-4 w-4" /> Edit survey
                    </Link>
                  </Button>
                </RoleGate>
              )}
            </div>
          </div>

          {canReview && (
            <p className="relative mt-4 rounded-xl border border-amber-300/50 bg-amber-100/50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-100">
              This survey is <strong>awaiting your QC decision</strong>. Review all sections below, then approve or
              return for correction using the panel on the right.
            </p>
          )}
        </div>

        {/* Main content: survey detail + QC panel */}
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
          <SurveyDetailView survey={survey} surveyId={id} remarks={remarks} hideProgressFooter />
          <div className="lg:sticky lg:top-4">
            <QcPanel survey={survey} />
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
