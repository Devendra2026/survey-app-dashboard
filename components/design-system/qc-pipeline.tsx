"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, FileCheck, GitBranch, XCircle } from "lucide-react";

type PipelineStage = {
  id: string;
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
};

export function QcPipeline({
  pending,
  inReview,
  approved,
  rejected,
  className,
}: {
  pending: number;
  inReview?: number;
  approved: number;
  rejected: number;
  className?: string;
}) {
  const stages: PipelineStage[] = [
    {
      id: "pending",
      label: "Pending",
      count: pending,
      icon: Clock3,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
    {
      id: "review",
      label: "In Review",
      count: inReview ?? 0,
      icon: GitBranch,
      color: "text-brand-navy dark:text-primary bg-brand-navy/10 border-brand-navy/25",
    },
    {
      id: "approved",
      label: "Approved",
      count: approved,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      id: "rejected",
      label: "Rejected",
      count: rejected,
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
  ];

  const total = pending + (inReview ?? 0) + approved + rejected || 1;

  return (
    <GlassCard padding="md" className={className}>
      <GlassCardHeader
        title="QC Workflow Pipeline"
        description="End-to-end quality control stages"
        icon={<FileCheck className="h-4 w-4" aria-hidden />}
      />
      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4" aria-label="QC pipeline stages">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const pct = Math.round((stage.count / total) * 100);
          return (
            <li key={stage.id}>
              <div className={cn("rounded-xl border p-4 transition-all duration-200 hover:shadow-md", stage.color)}>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="font-mono text-2xl font-bold tabular-nums">{stage.count}</span>
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider">{stage.label}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/50">
                  <progress
                    className="h-full w-full appearance-none rounded-full bg-transparent [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-current [&::-webkit-progress-value]:opacity-60"
                    value={pct}
                    max={100}
                    aria-label={`${stage.label} ${pct}%`}
                  />
                </div>
              </div>
              {i < stages.length - 1 && <div className="mx-auto mt-2 hidden h-px w-8 bg-border lg:block" aria-hidden />}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

export function QcReviewTimeline({
  events,
  className,
}: {
  events: Array<{ id: string; label: string; timestamp?: number; status: "done" | "current" | "pending" }>;
  className?: string;
}) {
  return (
    <GlassCard padding="md" className={className}>
      <GlassCardHeader title="Review Timeline" description="QC decision progression" />
      <ol className="relative space-y-0" aria-label="QC review timeline">
        {events.map((event, i) => (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < events.length - 1 && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px",
                  event.status === "done" ? "bg-primary/40" : "bg-border",
                )}
                aria-hidden
              />
            )}
            <div
              className={cn(
                "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                event.status === "done" && "border-primary bg-primary text-primary-foreground",
                event.status === "current" && "border-primary bg-primary/10 text-primary",
                event.status === "pending" && "border-border bg-muted text-muted-foreground",
              )}
              aria-current={event.status === "current" ? "step" : undefined}
            >
              {i + 1}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-sm font-medium", event.status === "pending" && "text-muted-foreground")}>
                {event.label}
              </p>
              {event.timestamp && (
                <time className="text-xs text-muted-foreground" dateTime={new Date(event.timestamp).toISOString()}>
                  {new Date(event.timestamp).toLocaleString()}
                </time>
              )}
            </div>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}
