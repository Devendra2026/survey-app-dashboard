"use client";

import { useConvexAuth } from "convex/react";

/**
 * True when Convex has a valid auth token — use to skip queries/mutations until
 * the Clerk JWT is synced and not being refreshed (queries fired during refresh
 * can hit UNAUTHORIZED even while `isAuthenticated` stays true).
 */
export function useConvexAuthReady(): boolean {
  const { isLoading, isAuthenticated, isRefreshing } = useConvexAuth();
  return !isLoading && isAuthenticated && !isRefreshing;
}
