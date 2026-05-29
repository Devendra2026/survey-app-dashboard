"use client";

import { can, canAny, type Capability } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";

/**
 * Hides children unless the current user's role has the capability. This is a
 * UI affordance only — the server still enforces every action (see
 * permissions.ts header). Use `fallback` to show a "not permitted" message
 * where appropriate, otherwise it renders nothing.
 */
export function RoleGate({
  capability,
  anyOf,
  children,
  fallback = null,
}: {
  capability?: Capability;
  anyOf?: Capability[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role } = useCurrentUser();
  const allowed = capability ? can(role, capability) : anyOf ? canAny(role, anyOf) : false;
  return <>{allowed ? children : fallback}</>;
}
