"use client";

import { QcFinalReportView } from "@/components/qc/qc-final-report-view";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleGate } from "@/components/shared/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import { useCurrentUser } from "@/lib/session";
import { use } from "react";

export default function QcFinalReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const survey = useSurvey(id);
  const { user } = useCurrentUser();

  if (survey === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (survey === null) return <EmptyState title="Survey not found" />;

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="QC final reports are available to supervisors and administrators."
    >
      <QcFinalReportView survey={survey} surveyId={id} auditorName={user?.name} />
    </RoleGate>
  );
}
