"use client";

import type { QcToolbarVariant } from "@/components/qc/qc-action-bar.types";
import { qcActionBtn } from "@/components/qc/qc-action-styles";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SurveyListItem } from "@/schema/surveys/index";
import { CheckCircle2, Eye, Loader2, MoreHorizontal, Pencil, RotateCcw, Save, Trash2, XCircle } from "lucide-react";
import Link from "next/link";

type QcActionBarToolbarProps = {
  survey: Pick<SurveyListItem, "_id" | "status" | "qcStatus">;
  variant: QcToolbarVariant;
  isWorking: boolean;
  saving: boolean;
  onDeleteOpen: () => void;
  onRewriteOpen: () => void;
  onSave: () => void;
  onApprove: () => void;
  onReopen: () => void;
};

export function QcActionBarToolbar({
  survey,
  variant,
  isWorking,
  saving,
  onDeleteOpen,
  onRewriteOpen,
  onSave,
  onApprove,
  onReopen,
}: QcActionBarToolbarProps) {
  const isApproved = variant === "approved";
  const showEditLink = variant === "review-pending" || variant === "review-blocked";
  const showReviewLink = variant === "edit-needs-save" || variant === "edit-ready" || variant === "edit-blocked";
  const showSave = variant === "edit-needs-save";
  const showDecide = variant === "review-pending" || variant === "edit-ready";
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <RoleGate capability="surveys.delete" fallback={null}>
          {!isApproved && (
            <Button
              type="button"
              variant="ghost"
              disabled={isWorking}
              onClick={onDeleteOpen}
              className={cn(qcActionBtn.base, qcActionBtn.delete)}
              aria-label="Delete survey"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </Button>
          )}
        </RoleGate>

        {showEditLink && (
          <RoleGate capability="qc.review" fallback={null}>
            <Button asChild variant="outline" className={cn(qcActionBtn.base, qcActionBtn.edit)}>
              <Link href={`/qc/${survey._id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </Link>
            </Button>
          </RoleGate>
        )}

        {showReviewLink && (
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
                <DropdownMenuItem disabled={isWorking} onClick={() => void onReopen()} className="cursor-pointer gap-2">
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reopen for review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </RoleGate>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {showSave && (
          <RoleGate capability="surveys.editDraft" fallback={null}>
            <Button
              type="button"
              disabled={isWorking}
              onClick={() => void onSave()}
              className={cn(qcActionBtn.base, qcActionBtn.save, isWorking && "opacity-80")}
            >
              {saving || isWorking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {saving ? "Saving…" : "Save"}
            </Button>
          </RoleGate>
        )}

        {showDecide && (
          <RoleGate capability="qc.decide" fallback={null}>
            <Button
              type="button"
              variant="outline"
              disabled={isWorking}
              onClick={onRewriteOpen}
              className={cn(qcActionBtn.base, qcActionBtn.rewrite)}
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Re-write
            </Button>
            <Button
              type="button"
              disabled={isWorking}
              onClick={() => void onApprove()}
              className={cn(qcActionBtn.base, qcActionBtn.approve)}
            >
              {isWorking ? (
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
  );
}
