"use client";

import { DemandNoticeView } from "@/components/qc/demand-notice-view";
import { EmptyState } from "@/components/shared/empty-state";
import { CardsSkeleton } from "@/components/shared/loading";
import { RoleGate } from "@/components/shared/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import { use } from "react";

export default function DemandNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const survey = useSurvey(id);

  if (survey === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-44 rounded-xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <CardsSkeleton count={5} />
        <Skeleton className="mx-auto h-[720px] max-w-5xl rounded-2xl" />
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
      <DemandNoticeView survey={survey} surveyId={id} />
    </RoleGate>
  );
}
