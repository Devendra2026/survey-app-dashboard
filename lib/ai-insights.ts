export type AiInsight = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical" | "opportunity";
  metric?: string;
  action?: { label: string; href: string };
};

/** Derives heuristic insights from dashboard metrics — no external AI API required. */
export function deriveAiInsights(input: {
  total: number;
  pendingQc: number;
  rejected: number;
  approved: number;
  today: number;
  rejectionRate: number;
  wardCoverageLow?: number;
}): AiInsight[] {
  const insights: AiInsight[] = [];

  if (input.pendingQc > 0 && input.total > 0) {
    const pct = Math.round((input.pendingQc / input.total) * 100);
    if (pct >= 20) {
      insights.push({
        id: "qc-backlog",
        title: "QC backlog building",
        body: `${input.pendingQc} surveys (${pct}%) await review. Prioritize oldest submissions to maintain SLA.`,
        severity: pct >= 35 ? "critical" : "warning",
        metric: `${input.pendingQc} pending`,
        action: { label: "Open QC queue", href: "/qc" },
      });
    }
  }

  if (input.rejectionRate >= 8) {
    insights.push({
      id: "rejection-rate",
      title: "Elevated rejection rate",
      body: `Rejection rate at ${input.rejectionRate}% — review common remark tags and surveyor training gaps.`,
      severity: input.rejectionRate >= 15 ? "critical" : "warning",
      metric: `${input.rejectionRate}%`,
      action: { label: "View rejected", href: "/surveys" },
    });
  }

  if (input.today > 0 && input.approved > 0) {
    insights.push({
      id: "momentum",
      title: "Field momentum detected",
      body: `${input.today} surveys captured today with ${input.approved} total approvals in scope.`,
      severity: "opportunity",
      metric: `+${input.today} today`,
    });
  }

  if (input.wardCoverageLow !== undefined && input.wardCoverageLow > 0) {
    insights.push({
      id: "coverage-gap",
      title: "Coverage gaps identified",
      body: `${input.wardCoverageLow} wards below 50% coverage target. Reallocate surveyor capacity.`,
      severity: "info",
      metric: `${input.wardCoverageLow} wards`,
      action: { label: "View coverage", href: "/dashboard" },
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "healthy",
      title: "Operations within normal range",
      body: "Pipeline metrics are balanced. No immediate intervention required.",
      severity: "info",
    });
  }

  return insights.slice(0, 4);
}
