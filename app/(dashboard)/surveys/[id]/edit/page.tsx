"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { FloorsEditor } from "@/components/surveys/floors-editor";
import { GpsCapturePanel } from "@/components/surveys/gps-capture";
import { PhotoUploader } from "@/components/surveys/photo-uploader";
import { SurveyForm } from "@/components/surveys/survey-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubmitSurvey, useSurvey } from "@/hooks/surveys/useSurveys";
import { parseConvexError } from "@/lib/errors";
import { ArrowLeft, Eye, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

export default function SurveyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const survey = useSurvey(id);
  const submitSurvey = useSubmitSurvey();
  const [submitting, setSubmitting] = useState(false);

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

  const locked = survey.qcStatus === "approved";
  const canSubmit = survey.status === "draft" || survey.status === "rejected";

  async function onSubmit() {
    if (!confirm("Submit this survey for QC review? You won't be able to edit it until it's reviewed.")) return;
    setSubmitting(true);
    try {
      await submitSurvey({ id: id as any });
      toast.success("Survey submitted for QC");
      router.push(`/surveys/${id}`);
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RoleGate
      capability="surveys.editDraft"
      fallback={<EmptyState title="Not permitted" description="You don't have permission to edit surveys." />}
    >
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href={`/surveys/${id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to detail
          </Link>
        </Button>

        <PageHeader
          title={`Edit — ${survey.propertyId || `Parcel ${survey.parcelNo}`}`}
          description={`${survey.city} · Ward ${survey.wardNo} · Save each section, then add floors, photos and GPS before submitting.`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <SurveyStatusBadge status={survey.status} />
              <QcStatusBadge status={survey.qcStatus} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/surveys/${id}`}>
                  <Eye className="h-4 w-4" /> View detail
                </Link>
              </Button>
              {canSubmit && !locked && (
                <RoleGate capability="surveys.submit">
                  <Button size="sm" disabled={submitting} onClick={onSubmit}>
                    <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit for QC"}
                  </Button>
                </RoleGate>
              )}
            </div>
          }
        />

        {locked ? (
          <EmptyState
            title="Survey locked"
            description="This survey has been approved and can no longer be edited. Contact a supervisor to re-open it."
            action={
              <Button asChild variant="outline">
                <Link href={`/surveys/${id}`}>View detail</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            <SurveyForm localId={survey.localId} existing={survey} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Floors</CardTitle>
              </CardHeader>
              <CardContent>
                <FloorsEditor surveyId={id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoUploader surveyId={id} />
              </CardContent>
            </Card>

            <GpsCapturePanel surveyId={id} gps={survey.gps} />

            {canSubmit && (
              <RoleGate capability="surveys.submit">
                <div className="flex justify-end border-t border-border pt-5">
                  <Button disabled={submitting} onClick={onSubmit}>
                    <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit for QC"}
                  </Button>
                </div>
              </RoleGate>
            )}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
