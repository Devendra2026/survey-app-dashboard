"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_ROLE_LABEL, USER_STATUS_LABEL, type UserStatus } from "@/lib/domain";
import type { Role } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import type { ReactNode } from "react";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function statusBadgeVariant(status: UserStatus): "default" | "secondary" | "destructive" {
  if (status === "active") return "default";
  if (status === "disabled") return "destructive";
  return "secondary";
}

function roleLabel(role: Role | undefined): string {
  if (!role) return "—";
  return USER_ROLE_LABEL[role] ?? role;
}

export default function SettingsPage() {
  const { user, role, isLoading } = useCurrentUser();

  if (isLoading || !user) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Your profile and assigned scope. Scope changes are made by an administrator."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Role" value={role ? <Badge variant="outline">{roleLabel(role)}</Badge> : "—"} />
            <Row
              label="Account status"
              value={<Badge variant={statusBadgeVariant(user.status)}>{USER_STATUS_LABEL[user.status]}</Badge>}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned scope</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="District" value={user.district?.name ?? "—"} />
            <Row label="Municipality" value={user.municipality?.name ?? "—"} />
            <Row label="Wards" value={user.wardAssignments.length ? user.wardAssignments.join(", ") : "All in ULB"} />
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Authentication is managed by Clerk (use the avatar menu, top-right, to manage your account or sign out). Your
        role and tenant scope are enforced server-side on the shared Convex backend.
      </p>
    </div>
  );
}
