"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiInsight } from "@/lib/ai-insights";
import { cn } from "@/lib/utils";
import { ArrowRight, Brain, Sparkles } from "lucide-react";

const severityStyles = {
  info: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  critical: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  opportunity: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

const severityLabel = {
  info: "Insight",
  warning: "Attention",
  critical: "Risk",
  opportunity: "Opportunity",
};

export function AiInsightsPanel({ insights, className }: { insights: AiInsight[]; className?: string }) {
  return (
    <GlassCard variant="ai" padding="md" className={className}>
      <GlassCardHeader
        title="AI Intelligence"
        description="Automated operational insights from live survey data"
        icon={<Brain className="h-4 w-4" aria-hidden />}
        action={
          <Badge variant="outline" className="gap-1 border-brand-red/30 text-brand-red">
            <Sparkles className="h-3 w-3" aria-hidden />
            Live
          </Badge>
        }
      />
      <ul className="space-y-3" aria-label="AI insights">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className={cn("rounded-xl border p-3 transition-colors duration-200", severityStyles[insight.severity])}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    {severityLabel[insight.severity]}
                  </span>
                  {insight.metric && (
                    <span className="rounded-md bg-background/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold">{insight.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed opacity-90">{insight.body}</p>
              </div>
            </div>
            {insight.action && (
              <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1 px-2 text-xs" asChild>
                <a href={insight.action.href}>
                  {insight.action.label}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </a>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
