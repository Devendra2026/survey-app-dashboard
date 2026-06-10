"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { chartPalette, chartTooltipStyle } from "./chart-theme";

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
