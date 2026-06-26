"use client";

/** Notifications — bound to the existing notification functions in masters.ts. */
import { api } from "@/convex/_generated/api";
import { useConvexAuthReady } from "@/hooks/use-convex-auth-ready";
import { useMutation, useQuery } from "convex/react";

export function useNotifications(limit = 30, enabled = true) {
  const ready = useConvexAuthReady();
  return useQuery(api.masters.listNotifications, ready && enabled ? { limit } : "skip");
}

export function useUnreadCount(enabled = true) {
  const ready = useConvexAuthReady();
  return useQuery(api.masters.unreadCount, ready && enabled ? {} : "skip") ?? 0;
}

export function useMarkRead() {
  return useMutation(api.masters.markRead);
}

export function useMarkAllRead() {
  return useMutation(api.masters.markAllRead);
}
