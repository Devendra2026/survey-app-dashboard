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

type QcReopenDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  isWorking: boolean;
  onConfirm: () => void;
};

export function QcReopenDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  isWorking,
  onConfirm,
}: QcReopenDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle>Reopen for review</AlertDialogTitle>
          <AlertDialogDescription>
            This survey will return to the QC queue as <strong>pending</strong>. You can correct the data, save, and
            approve again. Enter a reason for the audit log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Why is this survey being reopened?"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="min-h-24 rounded-xl"
          aria-label="Reopen reason"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isWorking || !reason.trim()}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            Reopen survey
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
