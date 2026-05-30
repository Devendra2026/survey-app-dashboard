"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_HEIGHT_PX = 288;

/** Fixed height — percentage height inside a scrollable main can inflate page scroll. */
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

const COLORS = {
  navy: "hsl(215 60% 32%)",
  green: "hsl(152 55% 38%)",
  amber: "hsl(35 92% 48%)",
  red: "hsl(0 72% 50%)",
  slate: "hsl(215 12% 55%)",
};

const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: "1px solid hsl(215 16% 88%)", fontSize: 12 },
};

export function TrendChart({
  data,
  title,
}: {
  data?: { date: string; created: number; submitted: number; approved: number; rejected: number }[];
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartViewport>
          <AreaChart data={data ?? []} margin={{ left: -16, right: 8, top: 4 }}>
            <defs>
              <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.navy} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.navy} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 16% 92%)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="created"
              name="Created"
              stroke={COLORS.navy}
              fill="url(#gCreated)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="approved"
              name="Approved"
              stroke={COLORS.green}
              fill="url(#gApproved)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="rejected"
              name="Rejected"
              stroke={COLORS.red}
              fillOpacity={0}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartViewport>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartViewport>
          <BarChart data={(data ?? []).slice(0, 10)} margin={{ left: -16, right: 8, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 16% 92%)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="approved" name="Approved" stackId="a" fill={COLORS.green} radius={[0, 0, 0, 0]} />
            <Bar dataKey="submitted" name="Submitted" stackId="a" fill={COLORS.navy} />
            <Bar dataKey="drafts" name="Drafts" stackId="a" fill={COLORS.slate} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartViewport>
      </CardContent>
    </Card>
  );
}

export function CoverageChart({
  data,
  title,
}: {
  data?: { label: string; total: number; approvalRate: number }[];
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartViewport>
          <BarChart data={(data ?? []).slice(0, 12)} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 16% 92%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={90} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="total" name="Surveys" radius={[0, 4, 4, 0]}>
              {(data ?? []).slice(0, 12).map((d, i) => (
                <Cell
                  key={i}
                  fill={d.approvalRate >= 60 ? COLORS.green : d.approvalRate >= 30 ? COLORS.amber : COLORS.slate}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartViewport>
      </CardContent>
    </Card>
  );
}
