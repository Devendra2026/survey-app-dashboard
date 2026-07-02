"use client";

import { ExecutiveHero } from "@/components/design-system/executive-hero";
import { FadeIn } from "@/components/design-system/motion";
import { can } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import { ClipboardList, LayoutDashboard, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function DashboardShell() {
  const { user, role } = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const municipality = user?.municipality?.name;

  return (
    <FadeIn>
      <ExecutiveHero
        eyebrow="Survey Dashboard"
        title={`Welcome back, ${firstName}`}
        description={
          municipality
            ? `Operations overview for ${municipality} — pipeline health, team capacity, and QC throughput.`
            : "Operations overview across your assigned scope — pipeline health, team capacity, and QC throughput."
        }
        icon={LayoutDashboard}
        gradient="brand"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/surveys"
              className="btn-brand inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition-colors duration-200"
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Surveys
            </Link>
            {can(role, "qc.review") && (
              <Link
                href="/qc"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors duration-200 hover:bg-muted/50"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                QC Queue
              </Link>
            )}
          </div>
        }
      />
    </FadeIn>
  );
}
