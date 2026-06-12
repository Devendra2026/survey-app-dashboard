"use client";

import { qcActionBtn } from "@/components/qc/qc-action-styles";
import { RoleGate } from "@/components/shared/role-gate";
import type { SurveyRow } from "@/components/surveys/survey-tables";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useDecide, useReopen } from "@/hooks/qc/useQc";
import { useRemoveSurvey } from "@/hooks/surveys/useSurveys";
import { parseConvexError } from "@/lib/errors";
import { scopeFromSurveyRow } from "@/lib/qc/work-scope";
import { cn } from "@/lib/utils";
import type { SurveyListItem } from "@/schema/surveys/index";
import { CheckCircle2, Eye, Loader2, MoreHorizontal, Pencil, RotateCcw, Save, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function buildNextQcHref(
  nextId: string,
  scope: { wardNo?: string; municipalityId?: string; districtId?: string },
): string {
  const params = new URLSearchParams();
  if (scope.wardNo) params.set("wardNo", scope.wardNo);
  if (scope.municipalityId) params.set("municipalityId", scope.municipalityId);
  if (scope.districtId) params.set("districtId", scope.districtId);
  const qs = params.toString();
  return qs ? `/qc/${nextId}?${qs}` : `/qc/${nextId}`;
}

export function QcActionBar({
  survey,
  nextSurvey,
  scope = {},
  mode = "review",
  correctionsSaved = false,
  onSave,
  saving = false,
  onCorrectionsSaved,
}: {
  survey: Pick<SurveyListItem, "_id" | "status" | "qcStatus" | "propertyId" | "parcelNo">;
  nextSurvey?: SurveyRow;
  scope?: { wardNo?: string; municipalityId?: string };
  /** review = read-only survey view; edit = correction form */
  mode?: "review" | "edit";
  /** Edit mode: show Approved after a successful save this session */
  correctionsSaved?: boolean;
  onSave?: () => Promise<boolean | void>;
  saving?: boolean;
  onCorrectionsSaved?: () => void;
}) {
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

  function statusHint(): string | null {
    if (mode === "edit" && isPending && !correctionsSaved) {
      return "Save your corrections first — then approve or return for re-write.";
    }
    if (mode === "edit" && isPending && correctionsSaved) {
      return "Corrections saved — approve to continue to the next survey automatically.";
    }
    if (isApproved) return "This survey is approved and locked.";
    if (isDraft) return "Awaiting surveyor re-submit — approve and re-write are unavailable until resubmitted.";
    if (isPending)
      return "Review the survey, then approve or return for re-write. Approving moves to the next QC automatically.";
    return null;
  }

  const hint = statusHint();

  return (
    <>
      <div
        className="premium-card sticky bottom-0 z-20 overflow-hidden rounded-2xl border border-amber-500/25 bg-card/95 shadow-premium-lg backdrop-blur-md dark:border-amber-400/20"
        role="region"
        aria-label={mode === "edit" ? "QC correction actions" : "QC review actions"}
      >
        <div className="h-1 w-full bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isApproved
                ? "w-full bg-linear-to-r from-emerald-600 to-emerald-500"
                : correctionsSaved
                  ? "w-3/4 bg-linear-to-r from-amber-500 to-emerald-500"
                  : "w-1/2 bg-linear-to-r from-amber-500 to-amber-400",
            )}
          />
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4">
          {hint && <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{hint}</p>}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <RoleGate capability="surveys.delete" fallback={null}>
                {!isApproved && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isWorking}
                    onClick={() => setDeleteOpen(true)}
                    className={cn(qcActionBtn.base, qcActionBtn.delete)}
                    aria-label="Delete survey"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </Button>
                )}
              </RoleGate>

              {mode === "review" && !isApproved && (
                <RoleGate capability="qc.review" fallback={null}>
                  <Button asChild variant="outline" className={cn(qcActionBtn.base, qcActionBtn.edit)}>
                    <Link href={`/qc/${survey._id}/edit`}>
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit
                    </Link>
                  </Button>
                </RoleGate>
              )}

              {mode === "edit" && !isApproved && (
                <Button asChild variant="outline" className={cn(qcActionBtn.base, qcActionBtn.secondary)}>
                  <Link href={`/qc/${survey._id}`}>
                    <Eye className="h-4 w-4" aria-hidden />
                    Review
                  </Link>
                </Button>
              )}

              {isApproved && (
                <RoleGate capability="qc.reopen" fallback={null}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isWorking}
                        className={cn(qcActionBtn.base, qcActionBtn.secondary, "min-w-11 px-3")}
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        disabled={isWorking}
                        onClick={() => void handleReopen()}
                        className="cursor-pointer gap-2"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Reopen for review
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </RoleGate>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {mode === "edit" && isPending && (
                <RoleGate capability="surveys.editDraft" fallback={null}>
                  <Button
                    type="button"
                    disabled={isWorking}
                    onClick={() => void handleSave()}
                    className={cn(qcActionBtn.base, qcActionBtn.save, isWorking && "opacity-80")}
                  >
                    {saving || busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden />
                    )}
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </RoleGate>
              )}

              {canApprove && (
                <RoleGate capability="qc.decide" fallback={null}>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isWorking}
                    onClick={() => setRewriteOpen(true)}
                    className={cn(qcActionBtn.base, qcActionBtn.rewrite)}
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                    Re-write
                  </Button>
                  <Button
                    type="button"
                    disabled={isWorking}
                    onClick={() => void handleApprove()}
                    className={cn(qcActionBtn.base, qcActionBtn.approve)}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                    )}
                    Approved
                  </Button>
                </RoleGate>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={rewriteOpen} onOpenChange={setRewriteOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Return for re-write</AlertDialogTitle>
            <AlertDialogDescription>
              The survey will return to <strong>draft</strong> so the surveyor can fix and resubmit. Enter a reason they
              will see in their notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="What needs to be corrected?"
            value={rewriteReason}
            onChange={(e) => setRewriteReason(e.target.value)}
            className="min-h-24 rounded-xl"
            aria-label="Re-write reason"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isWorking || !rewriteReason.trim()}
              onClick={(e) => {
                e.preventDefault();
                void handleRewrite();
              }}
            >
              Confirm re-write
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Delete survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{propertyLabel}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isWorking}
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** @deprecated Use QcActionBar */
export const QcReviewActionBar = QcActionBar;
