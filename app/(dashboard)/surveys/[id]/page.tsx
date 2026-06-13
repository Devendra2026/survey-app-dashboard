"use client";

import { PageTransition } from "@/components/design-system/motion";
import { EmptyState } from "@/components/shared/empty-state";
import { SurveyPageDetailView } from "@/components/surveys/survey-detail-view";
import { SurveyViewHero } from "@/components/surveys/survey-view-hero";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQcRemarks } from "@/hooks/qc/useQc";
import { useRemoveSurvey, useSurvey } from "@/hooks/surveys/useSurveys";
import { canUserEditSurvey } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import { useCurrentUser } from "@/lib/session";
import { ArrowLeft } from "lucide-react";
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
  const { role, capabilities } = useCurrentUser();
  const canEdit = survey ? canUserEditSurvey(survey, { role, capabilities }) : false;

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

  return (
    <PageTransition className="space-y-6 lg:space-y-8">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-fit cursor-pointer rounded-xl border-border/70 bg-card/80 px-4 shadow-premium-sm backdrop-blur-sm transition-colors duration-200 hover:bg-muted/40"
      >
        <Link href="/surveys">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to surveys
        </Link>
      </Button>

      <SurveyViewHero survey={survey} surveyId={id} canEdit={canEdit} showStatus onDelete={() => void onDelete()} />

      <SurveyPageDetailView survey={survey as any} surveyId={id} remarks={remarks as any} />
    </PageTransition>
  );
}
