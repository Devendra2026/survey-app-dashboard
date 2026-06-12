"use client";

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
import { Textarea } from "@/components/ui/textarea";

type QcRewriteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  isWorking: boolean;
  onConfirm: () => void;
};

export function QcRewriteDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  isWorking,
  onConfirm,
}: QcRewriteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="min-h-24 rounded-xl"
          aria-label="Re-write reason"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isWorking || !reason.trim()}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            Confirm re-write
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type QcDeleteSurveyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyLabel: string;
  isWorking: boolean;
  onConfirm: () => void;
};

export function QcDeleteSurveyDialog({
  open,
  onOpenChange,
  propertyLabel,
  isWorking,
  onConfirm,
}: QcDeleteSurveyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
              onConfirm();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
