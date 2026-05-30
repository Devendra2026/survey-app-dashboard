"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export function usePendingApprovals() {
  return useQuery(api.admin.listPendingApprovals);
}
export function useUserList(filters: { role?: any; status?: any } = {}) {
  return useQuery(api.admin.listUsers, { role: filters.role, status: filters.status });
}
export function useApproveUser() {
  return useMutation(api.admin.approveUser);
}
export function useRejectUser() {
  return useMutation(api.admin.rejectUser);
}
export function useAssignTenant() {
  return useMutation(api.admin.assignTenant);
}
export function useUpdateUser() {
  return useMutation(api.admin.updateUser);
}
/** Disable = updateUser({ status: 'disabled' }). */
export function useDisableUser() {
  const update = useMutation(api.admin.updateUser);
  return (userId: string) => update({ userId: userId as Id<"users">, status: "disabled" });
}
/** Catalog of districts/ULBs/wards for the approval & assignment forms. */
export function useTenantCatalog() {
  return useQuery(api.tenants.listForAdmin);
}
