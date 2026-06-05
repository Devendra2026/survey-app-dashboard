"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConvexError } from "convex/values";
import { ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Component, type ReactNode } from "react";

/** Compact inline notice for section-level gates (tabs, cards, toolbars). */
export function PermissionDeniedInline({
  description = "You don't have permission to view this content.",
}: {
  description?: string;
}) {
  return (
    <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
      {description}
    </p>
  );
}

/**
 * Modal shown when a user navigates to a page they cannot access.
 * Dismissal returns them to the dashboard — keeps the shell visible underneath.
 */
export function PermissionDeniedDialog({
  open = true,
  title = "Access Denied",
  description = "You don't have permission to view this content.",
  hint = "Contact your administrator if you believe you should have access.",
  redirectTo = "/dashboard",
  onDismiss,
}: {
  open?: boolean;
  title?: string;
  description?: string;
  hint?: string;
  redirectTo?: string;
  onDismiss?: () => void;
}) {
  const router = useRouter();

  function dismiss() {
    onDismiss?.();
    router.push(redirectTo);
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent size="default" className="sm:max-w-md">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-6 w-6 text-destructive/70" />
          </div>
          <AlertDialogTitle className="font-display text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-balance">{description}</AlertDialogDescription>
          {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={dismiss}>Return to Dashboard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface State {
  isForbidden: boolean;
  hasError: boolean;
  message?: string;
}

/**
 * Catches ConvexError { code: "FORBIDDEN" } thrown by useQuery/useMutation and
 * shows the access-denied dialog instead of crashing.
 */
export class ConvexPermissionBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, State> {
  state: State = { isForbidden: false, hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    if (
      error instanceof ConvexError &&
      typeof error.data === "object" &&
      error.data !== null &&
      (error.data as Record<string, unknown>).code === "FORBIDDEN"
    ) {
      return {
        isForbidden: true,
        hasError: true,
        message: (error.data as Record<string, unknown>).message as string | undefined,
      };
    }
    return { isForbidden: false, hasError: true };
  }

  render() {
    if (this.state.isForbidden) {
      return (
        this.props.fallback ?? (
          <PermissionDeniedDialog
            description={this.state.message ?? "You don't have permission to view this content."}
          />
        )
      );
    }
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
