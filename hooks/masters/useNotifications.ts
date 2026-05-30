"use client";

/** Notifications — bound to the existing notification functions in masters.ts. */
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export function useNotifications(limit = 30) {
  return useQuery(api.masters.listNotifications, { limit });
}

export function useUnreadCount() {
  return useQuery(api.masters.unreadCount) ?? 0;
}

export function useMarkRead() {
  return useMutation(api.masters.markRead);
}

export function useMarkAllRead() {
  return useMutation(api.masters.markAllRead);
}
