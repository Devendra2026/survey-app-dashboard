"use client";

import { useConvexAuth } from "convex/react";

/**
 * True when Convex has a valid auth token — use to skip queries/mutations until
 * the Clerk JWT is synced (Clerk `isSignedIn` alone can be true slightly earlier).
 */
export function useConvexAuthReady(): boolean {
  const { isLoading, isAuthenticated } = useConvexAuth();
  return !isLoading && isAuthenticated;
}
