"use client";

import { canAnyWithCapabilities, canWithCapabilities, type Capability } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";

/**
 * True when the signed-in user has the capability. Returns false while the
 * session is loading so callers can pass `"skip"` to useQuery and avoid
 * server-side FORBIDDEN errors for unauthorized roles.
 */
export function useHasCapability(capability: Capability): boolean {
  const { role, capabilities, isLoading } = useCurrentUser();
  if (isLoading || !role) return false;
  return canWithCapabilities(capabilities, role, capability);
}

export function useHasAnyCapability(caps: Capability[]): boolean {
  const { role, capabilities, isLoading } = useCurrentUser();
  if (isLoading || !role) return false;
  return canAnyWithCapabilities(capabilities, role, caps);
}
