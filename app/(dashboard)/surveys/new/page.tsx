"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { SurveyForm } from "@/components/surveys/survey-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Generates the idempotency key the mobile app would generate before sync. */
function newLocalId() {
  return `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function NewSurveyPage() {
  const router = useRouter();
  const [localId] = useState(newLocalId);

  return (
    <RoleGate
      capability="surveys.editDraft"
      fallback={<EmptyState title="Not permitted" description="Only surveyors and admins can create surveys." />}
    >
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/surveys">
            <ArrowLeft className="h-4 w-4" /> Back to surveys
          </Link>
        </Button>
        <PageHeader
          title="New Survey"
          description="Fill the property details and save a draft. Floors, photos and GPS are added after the first save."
        />
        <SurveyForm localId={localId} onSaved={(id) => router.push(`/surveys/${id}/edit`)} />
      </div>
    </RoleGate>
  );
}
