"use client";

import { ExecutiveHero } from "@/components/design-system/executive-hero";
import { PageTransition } from "@/components/design-system/motion";
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
import { ArrowLeft, Download, FileSearch, MapPin, Pencil, Trash2 } from "lucide-react";
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
      <PageTransition className="space-y-6">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-5">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageTransition>
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

  const propertyLabel = survey.propertyId || `Parcel ${survey.parcelNo}`;

  return (
    <PageTransition className="space-y-6 lg:space-y-8">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-fit cursor-pointer rounded-xl border-border/70 bg-card/80 px-4 shadow-premium-sm backdrop-blur-sm hover:bg-muted/40"
      >
        <Link href="/surveys">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to surveys
        </Link>
      </Button>

      <ExecutiveHero
        eyebrow="Survey View"
        title={propertyLabel}
        description={
          survey.city
            ? `${survey.city} · Ward ${survey.wardNo}${survey.respondentName ? ` · ${survey.respondentName}` : ""}`
            : "Property survey record and documentation"
        }
        icon={FileSearch}
        gradient="brand"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <SurveyStatusBadge status={survey.status} />
              <QcStatusBadge status={survey.qcStatus} />
              {survey.city && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {survey.city}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSurveyReportPdf(survey)}
              className="cursor-pointer rounded-xl border-brand-navy/25 bg-card/80 shadow-premium-sm hover:bg-brand-navy/5 dark:border-primary/30"
            >
              <Download className="h-4 w-4" aria-hidden /> PDF
            </Button>
            <RoleGate capability="surveys.editDraft" fallback={null}>
              {survey.qcStatus !== "approved" && (
                <Button
                  asChild
                  size="sm"
                  className={
                    survey.qcStatus === "rejected"
                      ? "btn-brand cursor-pointer rounded-xl shadow-md"
                      : "cursor-pointer rounded-xl bg-brand-navy text-white shadow-md hover:bg-brand-navy/90 dark:bg-primary dark:hover:bg-primary/90"
                  }
                >
                  <Link href={`/surveys/${id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    {survey.qcStatus === "rejected" ? "Fix & Re-submit" : "Edit"}
                  </Link>
                </Button>
              )}
            </RoleGate>
            <RoleGate capability="surveys.delete" fallback={null}>
              {survey.qcStatus !== "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="cursor-pointer rounded-xl border-brand-red/30 text-brand-red hover:bg-brand-red/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Delete
                </Button>
              )}
            </RoleGate>
          </div>
        }
      />

      <SurveyDetailView survey={survey as any} surveyId={id} remarks={remarks as any} />
    </PageTransition>
  );
}
