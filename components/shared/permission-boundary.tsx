"use client";

import { PermissionDeniedDialog } from "@/components/shared/permission-denied-dialog";
import { ConvexError } from "convex/values";
import { Component, type ReactNode } from "react";

export { PermissionDeniedDialog } from "@/components/shared/permission-denied-dialog";
export { PermissionDeniedInline } from "@/components/shared/permission-denied-inline";

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
