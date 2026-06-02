"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { approvalBarClass, chartPalette, chartTooltipStyle } from "./chart-theme";

const CHART_HEIGHT_PX = 288;

function ChartViewport({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0" style={{ height: CHART_HEIGHT_PX }}>
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT_PX}
        minWidth={0}
        initialDimension={{ width: 320, height: CHART_HEIGHT_PX }}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="font-display text-base font-semibold tracking-tight">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

export function TrendChart({
  data,
  title,
}: {
  data?: { date: string; created: number; submitted: number; approved: number; rejected: number }[];
  title: string;
}) {
  return (
    <ChartCard title={title} description="Created vs approved vs rejected over time">
      <ChartViewport>
        <AreaChart data={data ?? []} margin={{ left: -8, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartPalette.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={chartPalette.primary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartPalette.positive} stopOpacity={0.35} />
              <stop offset="100%" stopColor={chartPalette.positive} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(d) => String(d).slice(5)}
            minTickGap={24}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            allowDecimals={false}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...chartTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
          <Area
            type="monotone"
            dataKey="created"
            name="Created"
            stroke={chartPalette.primary}
            fill="url(#gCreated)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="approved"
            name="Approved"
            stroke={chartPalette.positive}
            fill="url(#gApproved)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="rejected"
            name="Rejected"
            stroke={chartPalette.negative}
            fillOpacity={0}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ChartViewport>
    </ChartCard>
  );
}

export function SurveyorProductivityChart({
  data,
  title,
}: {
  data?: { name: string; approved: number; submitted: number; drafts: number }[];
  title: string;
}) {
  return (
    <ChartCard title={title} description="Top surveyors by status (stacked)">
      <ChartViewport>
        <BarChart data={(data ?? []).slice(0, 10)} margin={{ left: -8, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            interval={0}
            angle={-22}
            textAnchor="end"
            height={64}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            allowDecimals={false}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...chartTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
          <Bar dataKey="approved" name="Approved" stackId="a" fill={chartPalette.positive} radius={[0, 0, 0, 0]} />
          <Bar dataKey="submitted" name="Submitted" stackId="a" fill={chartPalette.primary} />
          <Bar dataKey="drafts" name="Drafts" stackId="a" fill={chartPalette.muted} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartViewport>
    </ChartCard>
  );
}

export type WardCoverageItem = {
  wardNo: string;
  municipalityName: string;
  total: number;
  approvalRate: number;
};

/** Scrollable ward list — avoids cramped chart axis labels overlapping ward details. */
export function CoverageChart({ data, title }: { data?: WardCoverageItem[]; title: string }) {
  const rows = (data ?? []).slice(0, 20);

  return (
    <Card className="flex h-full min-h-80 flex-col shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="shrink-0 border-b border-border/60 pb-3">
        <CardTitle className="font-display text-base font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>Surveys per ward · bar color reflects approval rate</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No ward data in scope.</p>
        ) : (
          <ul className="max-h-[min(22rem,52vh)] space-y-3 overflow-y-auto pr-1 [-ms-overflow-style:none] scrollbar-thin">
            {rows.map((w) => (
              <li key={`${w.municipalityName}-${w.wardNo}`} className="space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-primary dark:bg-primary/20 dark:text-primary-foreground"
                    title={`Ward ${w.wardNo}`}
                  >
                    W{w.wardNo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug text-foreground" title={w.municipalityName}>
                      {w.municipalityName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.total} survey{w.total === 1 ? "" : "s"} · {w.approvalRate}% approved
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{w.total}</span>
                </div>
                <div className="ml-12.5 h-2 overflow-hidden rounded-full bg-muted/80">
                  <div
                    className={cn("h-full rounded-full transition-[width]", approvalBarClass(w.approvalRate))}
                    style={{ width: `${w.total > 0 ? Math.max(4, w.approvalRate) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function MunicipalityPerformanceCard({
  items,
  title = "Municipality Performance",
}: {
  items?: { id: string; name: string; approved: number; total: number }[];
  title?: string;
}) {
  return (
    <Card className="flex h-full min-h-80 flex-col shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="shrink-0 border-b border-border/60 pb-3">
        <CardTitle className="font-display text-base font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>Approval share within each ULB</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-3">
        {!items?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data in scope.</p>
        ) : (
          <ul className="max-h-[min(22rem,52vh)] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
            {items.map((m) => {
              const rate = m.total > 0 ? Math.round((m.approved / m.total) * 100) : 0;
              return (
                <li key={m.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-foreground" title={m.name}>
                      {m.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {m.approved}/{m.total} · {rate}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/80">
                    <div
                      className={cn("h-full rounded-full transition-[width]", approvalBarClass(rate))}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
