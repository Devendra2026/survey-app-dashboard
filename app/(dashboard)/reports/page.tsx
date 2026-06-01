"use client";

import { exportBreakdownExcel } from "@/components/reports/queries/exporters";
import { generateMunicipalitySummaryPdf, generateSurveyorPerformancePdf } from "@/components/reports/queries/pdf";
import { ReportCard } from "@/components/reports/report-card";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { CardsSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { SurveyExcelActions } from "@/components/surveys/survey-excel-actions";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { Button } from "@/components/ui/button";
import { useStatsBreakdown } from "@/hooks/analytics/useAnalytics";
import { Building2, FileBarChart, FileSpreadsheet, FileText, Users as UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";

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
      capability="reports.export"
      fallback={<EmptyState title="Not permitted" description="Reporting is available to supervisors and admins." />}
    >
      <div className="space-y-5">
        <PageHeader title="Reports" description="Generate and export survey, QC, municipality and surveyor reports." />
        <SurveyFilters value={filters} onChange={setFilters} showStatus={false} showQcStatus={false} />

        {breakdown === undefined ? (
          <CardsSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Surveys (scope)" value={breakdown.summary.total} />
            <KpiCard label="Approved" value={breakdown.summary.approved} tone="success" />
            <KpiCard label="Rejected" value={breakdown.summary.rejected} tone="destructive" />
            <KpiCard label="Municipalities" value={breakdown.byUlb.length} />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <ReportCard
            icon={FileText}
            title="Survey Report"
            desc="Full mobile survey data (all fields, co-owners, floors, photos) for the current filter scope."
            actions={<SurveyExcelActions filters={exportFilters} canImport />}
          />
          <ReportCard
            icon={Building2}
            title="Municipality Summary"
            desc="Per-ULB totals and approval rates."
            actions={
              <>
                <Button
                  variant="outline"
                  disabled={!ready}
                  onClick={() => breakdown && generateMunicipalitySummaryPdf(breakdown)}
                >
                  <FileBarChart className="h-4 w-4" /> PDF
                </Button>
                <Button
                  variant="outline"
                  disabled={!ready}
                  onClick={() => breakdown && exportBreakdownExcel(breakdown)}
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </Button>
              </>
            }
          />
          <ReportCard
            icon={UsersIcon}
            title="Surveyor Performance"
            desc="Per-surveyor productivity & approval %."
            actions={
              <Button
                variant="outline"
                disabled={!ready}
                onClick={() => breakdown && generateSurveyorPerformancePdf(breakdown)}
              >
                <FileBarChart className="h-4 w-4" /> PDF
              </Button>
            }
          />
          <ReportCard
            icon={FileText}
            title="QC Report"
            desc="Per-survey QC decisions & remark thread."
            actions={
              <p className="text-sm text-muted-foreground">
                Open any survey in QC and use the &quot;QC PDF&quot; action.
              </p>
            }
          />
        </div>
      </div>
    </RoleGate>
  );
}
