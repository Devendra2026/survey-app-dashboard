"use client";

import { generateSurveyReportPdf } from "@/components/reports/queries/pdf";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { SurveyDetailView } from "@/components/surveys/survey-detail-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQcRemarks } from "@/hooks/qc/useQc";
import { useRemoveSurvey, useSurvey } from "@/hooks/surveys/useSurveys";
import { parseConvexError } from "@/lib/errors";
import { ArrowLeft, Building2, Download, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";

export default function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const survey = useSurvey(id);
  const remarks = useQcRemarks(id);
  const removeSurvey = useRemoveSurvey();

  if (survey === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid gap-5">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }
  if (survey === null) {
    return <EmptyState title="Survey not found" description="It may have been deleted or is outside your scope." />;
  }

  async function onDelete() {
    if (!confirm("Delete this survey? This cannot be undone.")) return;
    try {
      await removeSurvey({ id: id as any });
      toast.success("Survey deleted");
      router.push("/surveys");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-fit rounded-full border-primary/30 bg-primary/5 px-4 text-primary hover:bg-primary/10"
      >
        <Link href="/surveys">
          <ArrowLeft className="h-4 w-4" /> Back to surveys
        </Link>
      </Button>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-200/60 bg-linear-to-r from-sky-50 via-indigo-50 to-blue-50 px-6 py-6 shadow-sm dark:border-sky-800/30 dark:from-sky-950/60 dark:via-indigo-950/50 dark:to-blue-950/40">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-28 w-28 rounded-full bg-indigo-300/20 blur-2xl dark:bg-indigo-500/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          {/* Left: property identity */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/60">
                <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-sky-600/80 dark:text-sky-400/70">
                Property Survey
              </span>
            </div>
            <h1 className="font-mono text-2xl font-black tracking-tight text-sky-950 dark:text-sky-50">
              {survey.propertyId || `Parcel ${survey.parcelNo}`}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <SurveyStatusBadge status={survey.status} />
              <QcStatusBadge status={survey.qcStatus} />
              {survey.city && (
                <span className="flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-700/40">
                  <MapPin className="h-3 w-3" />
                  {survey.city} · Ward {survey.wardNo}
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSurveyReportPdf(survey)}
              className="rounded-full border-blue-200 bg-white/80 text-blue-700 shadow-sm hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <RoleGate capability="surveys.editDraft">
              {survey.qcStatus !== "approved" && (
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-linear-to-r from-indigo-600 to-blue-600 text-white shadow-sm hover:from-indigo-500 hover:to-blue-500"
                >
                  <Link href={`/surveys/${id}/edit`}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                </Button>
              )}
            </RoleGate>
            <RoleGate capability="surveys.delete">
              {survey.qcStatus !== "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="rounded-full border-rose-300 bg-white/80 text-rose-700 shadow-sm hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/30"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
            </RoleGate>
          </div>
        </div>
      </div>

      {/* Detail content */}
      <SurveyDetailView survey={survey as any} surveyId={id} remarks={remarks as any} />
    </div>
  );
}
