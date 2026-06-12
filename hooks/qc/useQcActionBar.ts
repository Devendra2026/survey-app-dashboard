"use client";

import { EMPTY_QC_SCOPE, type QcActionBarProps } from "@/components/qc/qc-action-bar.types";
import { useDecide, useReopen } from "@/hooks/qc/useQc";
import { useRemoveSurvey } from "@/hooks/surveys/useSurveys";
import { parseConvexError } from "@/lib/errors";
import { buildNextQcHref } from "@/lib/qc/qc-nav";
import { scopeFromSurveyRow } from "@/lib/qc/work-scope";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function useQcActionBar({
  survey,
  nextSurvey,
  scope = EMPTY_QC_SCOPE,
  mode = "review",
  correctionsSaved = false,
  onSave,
  saving = false,
  onCorrectionsSaved,
}: QcActionBarProps) {
  const router = useRouter();
  const decide = useDecide();
  const reopen = useReopen();
  const removeSurvey = useRemoveSurvey();

  const [busy, setBusy] = useState(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rewriteReason, setRewriteReason] = useState("");

  const isApproved = survey.qcStatus === "approved";
  const isPending = survey.qcStatus === "pending" && survey.status === "submitted";
  const isDraft = survey.status === "draft";
  const canApprove = isPending && (mode === "review" || correctionsSaved);
  const isWorking = busy || saving;
  const propertyLabel = survey.propertyId || `Parcel ${survey.parcelNo}`;

  function advanceToNextQc() {
    if (nextSurvey) {
      router.push(buildNextQcHref(nextSurvey._id, scopeFromSurveyRow(nextSurvey)));
      return;
    }
    const wardLabel = scope.wardNo ? `Ward ${scope.wardNo}` : "this ward";
    toast.info(`QC complete for ${wardLabel}. Select another ward to continue.`);
    router.push("/qc");
  }

  async function runAction(fn: () => Promise<unknown>, successMessage: string, after?: () => void) {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      after?.();
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!onSave) return;
    setBusy(true);
    try {
      const ok = await onSave();
      if (ok !== false) {
        toast.success("Corrections saved");
        onCorrectionsSaved?.();
      }
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    setBusy(true);
    try {
      await decide({ surveyId: survey._id, decision: "approve" });
      toast.success("Survey approved — opening next QC");
      advanceToNextQc();
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRewrite() {
    const comment = rewriteReason.trim();
    if (!comment) {
      toast.error("Please enter a reason for re-write");
      return;
    }
    await runAction(
      () => decide({ surveyId: survey._id, decision: "reject", comment }),
      "Survey returned for re-write",
      () => {
        setRewriteOpen(false);
        setRewriteReason("");
        router.push("/qc");
      },
    );
  }

  async function handleDelete() {
    await runAction(
      () => removeSurvey({ id: survey._id }),
      "Survey deleted",
      () => router.push("/qc"),
    );
  }

  async function handleReopen() {
    await runAction(() => reopen({ surveyId: survey._id }), "Survey reopened for review");
  }

  return {
    survey,
    mode,
    scope,
    isApproved,
    isPending,
    isDraft,
    canApprove,
    isWorking,
    saving,
    propertyLabel,
    correctionsSaved,
    rewriteOpen,
    setRewriteOpen,
    deleteOpen,
    setDeleteOpen,
    rewriteReason,
    setRewriteReason,
    handleSave,
    handleApprove,
    handleRewrite,
    handleDelete,
    handleReopen,
  };
}
