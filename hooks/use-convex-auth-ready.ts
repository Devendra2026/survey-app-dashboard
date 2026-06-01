"use client";

import { useAuth } from "@clerk/nextjs";

/** True when Clerk is loaded and the user is signed in — use to skip Convex queries until JWT is available. */
export function useConvexAuthReady(): boolean {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded === true && isSignedIn === true;
}
