"use client";

import { generateSurveyReportPdf } from "@/components/reports/queries/pdf";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { SurveyDetailView } from "@/components/surveys/survey-detail-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQcRemarks } from "@/hooks/qc/useQc";
import { useRemoveSurvey, useSurvey } from "@/hooks/surveys/useSurveys";
import { parseConvexError } from "@/lib/errors";
import { ArrowLeft, Download, Pencil, Trash2 } from "lucide-react";
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
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

      <div className="rounded-2xl border border-border/70 bg-linear-to-r from-sky-50 to-indigo-50 px-6 py-5 shadow-sm dark:from-slate-900 dark:to-slate-800">
        <PageHeader
          title="Property Survey"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateSurveyReportPdf(survey)}
                className="rounded-full border-blue-200 bg-white text-blue-700 shadow-sm hover:bg-blue-50"
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
                    className="rounded-full border-rose-300 bg-white text-rose-700 shadow-sm hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                )}
              </RoleGate>
            </div>
          }
        />
      </div>

      <div className="grid gap-5">
        <SurveyDetailView survey={survey as any} surveyId={id} remarks={remarks as any} />
      </div>
    </div>
  );
}
