"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasCapability } from "@/hooks/use-capability";
import type { Capability } from "@/lib/permissions";
import { useMutation, useQuery } from "convex/react";

export function useRoles(opts?: { includeInactive?: boolean; requireCapability?: Capability }) {
  const capability = opts?.requireCapability ?? "roles.manage";
  const allowed = useHasCapability(capability);
  return useQuery(api.rbac.listRoles, allowed ? { includeInactive: opts?.includeInactive } : "skip");
}

export function usePermissions() {
  const allowed = useHasCapability("roles.manage");
  return useQuery(api.rbac.listPermissions, allowed ? {} : "skip");
}

export function useCreateRole() {
  return useMutation(api.rbac.createRole);
}

export function useUpdateRole() {
  return useMutation(api.rbac.updateRole);
}

export function useSeedRbac() {
  return useMutation(api.rbac.seedSystem);
}

export function useUserAllotments(userId: string | undefined) {
  const allowed = useHasCapability("users.view");
  return useQuery(api.allotments.listForUser, allowed && userId ? { userId: userId as Id<"users"> } : "skip");
}

export function useSetUserAllotments() {
  return useMutation(api.allotments.setForUser);
}

export function useToggleAllotment() {
  return useMutation(api.allotments.setActive);
}
