"use client";

import { ExecutiveHero, SectionHeader } from "@/components/design-system/executive-hero";
import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { MetricCard } from "@/components/design-system/metric-card";
import { PageTransition } from "@/components/design-system/motion";
import { exportBreakdownExcel } from "@/components/reports/queries/exporters";
import { generateMunicipalitySummaryPdf, generateSurveyorPerformancePdf } from "@/components/reports/queries/pdf";
import { CardsSkeleton } from "@/components/shared/loading";
import { RoleGate } from "@/components/shared/role-gate";
import { SurveyExcelActions } from "@/components/surveys/survey-excel-actions";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { Button } from "@/components/ui/button";
import { useStatsBreakdown } from "@/hooks/analytics/useAnalytics";
import {
  Building2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  LayoutTemplate,
  Save,
  Users as UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

const SAVED_REPORTS = [
  { id: "1", name: "Monthly ULB Summary", type: "PDF", updated: "2 days ago" },
  { id: "2", name: "Surveyor Performance Q1", type: "Excel", updated: "1 week ago" },
  { id: "3", name: "Ward Coverage Analysis", type: "Dashboard", updated: "2 weeks ago" },
];

export default function ReportsPage() {
  const [filters, setFilters] = useState<FilterState>({ search: "" });
  const breakdown = useStatsBreakdown({ districtId: filters.districtId, municipalityId: filters.municipalityId });
  const ready = !!breakdown;

  const exportFilters = useMemo(
    () => ({
      districtId: filters.districtId,
      municipalityId: filters.municipalityId,
      wardNo: filters.wardNo,
    }),
    [filters],
  );

  return (
    <RoleGate
      mode="page"
      capability="reports.export"
      deniedDescription="Reporting is available to supervisors and administrators."
    >
      <PageTransition className="space-y-6">
        <ExecutiveHero
          eyebrow="Reports & Analytics"
          title="Report Builder"
          description="Generate, save, and export survey, municipality, and surveyor reports. PDF, Excel, and dashboard exports."
          icon={FileBarChart}
          gradient="red"
        />

        <GlassCard padding="md">
          <SectionHeader title="Report Scope" description="Filter data before export" className="mb-4" />
          <SurveyFilters value={filters} onChange={setFilters} showStatus={false} showQcStatus={false} />
        </GlassCard>

        {breakdown === undefined ? (
          <CardsSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <MetricCard label="Surveys (scope)" value={breakdown.summary.total} icon={FileText} />
            <MetricCard label="Approved" value={breakdown.summary.approved} tone="success" icon={FileBarChart} />
            <MetricCard label="Rejected" value={breakdown.summary.rejected} tone="destructive" icon={FileSpreadsheet} />
            <MetricCard label="Municipalities" value={breakdown.byUlb.length} tone="info" icon={Building2} />
          </div>
        )}

        <div className="enterprise-grid">
          <div className="col-span-12 lg:col-span-8">
            <SectionHeader title="Visual Report Builder" description="Configure and export reports" className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <GlassCard padding="md" hover>
                <GlassCardHeader
                  icon={<FileText className="h-4 w-4" aria-hidden />}
                  title="Survey Report"
                  description="Full mobile survey data for current filter scope."
                />
                <SurveyExcelActions filters={exportFilters} canImport />
              </GlassCard>

              <GlassCard padding="md" hover>
                <GlassCardHeader
                  icon={<Building2 className="h-4 w-4" aria-hidden />}
                  title="Municipality Summary"
                  description="Per-ULB totals and approval rates."
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!ready}
                    className="cursor-pointer gap-1.5"
                    onClick={() => breakdown && generateMunicipalitySummaryPdf(breakdown)}
                  >
                    <FileBarChart className="h-4 w-4" aria-hidden /> PDF Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!ready}
                    className="cursor-pointer gap-1.5"
                    onClick={() => breakdown && exportBreakdownExcel(breakdown)}
                  >
                    <FileSpreadsheet className="h-4 w-4" aria-hidden /> Excel Export
                  </Button>
                </div>
              </GlassCard>

              <GlassCard padding="md" hover>
                <GlassCardHeader
                  icon={<UsersIcon className="h-4 w-4" aria-hidden />}
                  title="Surveyor Performance"
                  description="Per-surveyor productivity and approval %."
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!ready}
                  className="cursor-pointer gap-1.5"
                  onClick={() => breakdown && generateSurveyorPerformancePdf(breakdown)}
                >
                  <FileBarChart className="h-4 w-4" aria-hidden /> PDF Export
                </Button>
              </GlassCard>

              <GlassCard padding="md" hover>
                <GlassCardHeader
                  icon={<LayoutTemplate className="h-4 w-4" aria-hidden />}
                  title="QC Final Report"
                  description="Styled final report with property summary and certification."
                />
                <p className="text-sm text-muted-foreground">
                  Open any survey in QC and click &quot;QC Report Generate&quot; to view the report.
                </p>
              </GlassCard>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <SectionHeader title="Saved Reports" description="Quick access to recent exports" className="mb-4" />
            <GlassCard padding="md">
              <ul className="space-y-2" role="list">
                {SAVED_REPORTS.map((report) => (
                  <li
                    key={report.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-border/50 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{report.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {report.type} · {report.updated}
                      </p>
                    </div>
                    <Save className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="mt-4 w-full cursor-pointer gap-1.5" disabled>
                <Download className="h-4 w-4" aria-hidden />
                Dashboard Export (coming soon)
              </Button>
            </GlassCard>
          </div>
        </div>
      </PageTransition>
    </RoleGate>
  );
}
