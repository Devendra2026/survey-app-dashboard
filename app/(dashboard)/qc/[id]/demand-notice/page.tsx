"use client";

import { DemandNoticeView } from "@/components/qc/demand-notice-view";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleGate } from "@/components/shared/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import { use } from "react";

export default function DemandNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const survey = useSurvey(id);

  if (survey === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mx-auto h-[900px] max-w-4xl rounded-sm" />
      </div>
    );
  }

  if (survey === null) return <EmptyState title="Survey not found" />;

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Demand notices are available to supervisors and administrators."
    >
      <div className="rounded-2xl bg-slate-100/80 p-4 lg:p-8 dark:bg-slate-900/40">
        <DemandNoticeView survey={survey} surveyId={id} />
      </div>
    </RoleGate>
  );
}
