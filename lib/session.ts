"use client";

import { api } from "@/convex/_generated/api";
import type { Role } from "@/lib/permissions";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import {users} from "@/convex/users"

export type CurrentUser = {
  _id: string;
  email: string;
  name: string;
  role: Role;
  status: "pending_approval" | "active" | "disabled";
  districtId?: string;
  municipalityId?: string;
  wardAssignments: string[];
  municipality: { code: string; name: string } | null;
  district: { code: string; name: string } | null;
};

export function useCurrentUser() {
  const user = useQuery(api.clerk.currentUser) as CurrentUser | null | undefined;
  const provision = useMutation(api.clerk.provisionCurrentUser);
  const provisioned = useRef(false);

  useEffect(() => {
    // `undefined` = still loading; `null` = authenticated but no domain row yet.
    if (user === null && !provisioned.current) {
      provisioned.current = true;
      provision({}).catch(() => {
        // Webhook will eventually create the row; the reactive query recovers.
        provisioned.current = false;
      });
    }
  }, [user, provision]);

  return {
    user: user ?? null,
    role: (user?.role ?? undefined) as Role | undefined,
    isLoading: user === undefined,
    isActive: user?.status === "active",
    isPending: user?.status === "pending_approval",
    isDisabled: user?.status === "disabled",
  };
}
