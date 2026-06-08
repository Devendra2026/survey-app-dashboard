"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { MetricCard } from "@/components/design-system/metric-card";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { Button } from "@/components/ui/button";
import type { ListedUser, PendingUser } from "@/components/users/users-page-shared";
import { Ban, CheckCircle2, Clock, UserCheck, Users } from "lucide-react";

export function UsersHero() {
  return (
    <FadeIn>
      <ExecutiveHero
        eyebrow="Access Management"
        title="User Command Center"
        description="Approve registrations, assign roles and tenancy, and manage who can access surveys, QC, and admin tools."
        icon={UserCheck}
        gradient="brand"
      />
    </FadeIn>
  );
}

export function UsersPendingAlert({ pending }: { pending: PendingUser[] | undefined }) {
  const count = pending?.length ?? 0;
  if (count <= 0) return null;

  return (
    <FadeIn delay={0.04}>
      <output className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {count} registration{count === 1 ? "" : "s"} awaiting approval
            </p>
            <p className="text-xs text-muted-foreground">
              Review pending sign-ups in the Approval Queue tab before they can access the platform.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 cursor-pointer rounded-xl border-warning/50 bg-background/80"
          onClick={() => document.getElementById("users-registry")?.scrollIntoView({ behavior: "smooth" })}
        >
          <UserCheck className="h-4 w-4" aria-hidden />
          Open queue
        </Button>
      </output>
    </FadeIn>
  );
}

export function UsersMetricsSection({
  pending,
  users,
  activeCount,
  disabledCount,
}: {
  pending: PendingUser[] | undefined;
  users: ListedUser[] | undefined;
  activeCount: number;
  disabledCount: number;
}) {
  return (
    <section aria-labelledby="users-kpi-heading">
      <SectionHeader
        id="users-kpi-heading"
        title="User Metrics"
        description="Directory health and approval backlog"
        className="mb-4"
      />
      <StaggerGrid className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StaggerItem>
          <MetricCard
            label="Pending Approval"
            value={pending?.length ?? "—"}
            hint="awaiting supervisor review"
            icon={Clock}
            tone="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Total Users"
            value={users?.length ?? "—"}
            hint="registered accounts"
            icon={Users}
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Active"
            value={users ? activeCount : "—"}
            hint="can sign in today"
            icon={CheckCircle2}
            tone="success"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Disabled"
            value={users ? disabledCount : "—"}
            hint="access revoked"
            icon={Ban}
            tone="destructive"
          />
        </StaggerItem>
      </StaggerGrid>
    </section>
  );
}
