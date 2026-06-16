"use client";

import {
  DemandNoticePanelFilters,
  DemandNoticePanelHero,
  DemandNoticePanelKpis,
  DemandNoticePreviewSheet,
  DemandNoticeRegisterPrint,
  DemandNoticeRegisterTable,
} from "@/components/reports/demand-notice-panel";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { useDemandNoticePanel, type DemandRegisterRow } from "@/hooks/qc/useDemandNoticePanel";
import { useDemandRegisterPrint } from "@/hooks/reports/useDemandRegisterPrint";
import { formatInr } from "@/lib/qc/demand-estimate";
import { QC_TABLE_PAGE_SIZE_OPTIONS } from "@/lib/table-pagination";
import { Printer } from "lucide-react";
import { useMemo, useState } from "react";

function buildScopeLabel(filters: { districtId?: string; municipalityId?: string; wardNo?: string }) {
  const parts = [];
  if (filters.districtId) parts.push("District selected");
  if (filters.municipalityId) parts.push("ULB selected");
  if (filters.wardNo) parts.push(`Ward ${filters.wardNo}`);
  return parts.length > 0 ? parts.join(" · ") : "All accessible scope";
}

function DemandNoticeReportContent() {
  const [previewRow, setPreviewRow] = useState<DemandRegisterRow | null>(null);
  const {
    filters,
    setFilters,
    rows,
    totals,
    pageSize,
    setPageSize,
    pageNumber,
    canGoPrev,
    canGoNext,
    goPrev,
    goNext,
    isLoading,
    totalCount,
    requiresMunicipality,
  } = useDemandNoticePanel();
  const { printRegister } = useDemandRegisterPrint();
  const scopeLabel = useMemo(
    () =>
      buildScopeLabel({
        districtId: filters.districtId,
        municipalityId: filters.municipalityId,
        wardNo: filters.wardNo,
      }),
    [filters.districtId, filters.municipalityId, filters.wardNo],
  );

  return (
    <>
      <div className="space-y-6 demand-notice-panel-screen">
        <DemandNoticePanelHero />
        <DemandNoticePanelFilters value={filters} onChange={setFilters} requiresMunicipality={requiresMunicipality} />
        <DemandNoticePanelKpis
          propertyCount={totals.propertyCount}
          totalAnnualDemand={totals.totalAnnualDemand}
          avgDemand={totals.avgDemand}
        />

        <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <p className="text-sm font-semibold">Demand Register</p>
              <p className="text-xs text-muted-foreground">Scope: {scopeLabel}</p>
            </div>
            <Button variant="outline" onClick={printRegister} disabled={rows.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Print Register
            </Button>
          </div>

          {isLoading ? (
            <p className="py-8 text-sm text-muted-foreground">Loading demand register...</p>
          ) : (
            <DemandNoticeRegisterTable rows={rows} onPreview={setPreviewRow} />
          )}
          <TablePagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            itemCount={rows.length}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={goPrev}
            onNext={goNext}
            pageSizeOptions={[...QC_TABLE_PAGE_SIZE_OPTIONS]}
            onPageSizeChange={setPageSize}
            className="print:hidden"
          />
          <p className="mt-2 text-xs text-muted-foreground print:hidden">
            {totalCount.toLocaleString()} matching properties in scope.
          </p>
        </section>
      </div>

      <DemandNoticeRegisterPrint
        rows={rows}
        scopeLabel={scopeLabel}
        totalAnnualDemandLabel={formatInr(totals.totalAnnualDemand)}
      />

      <DemandNoticePreviewSheet
        row={previewRow}
        open={!!previewRow}
        onOpenChange={(open) => !open && setPreviewRow(null)}
      />
    </>
  );
}

export default function DemandNoticeReportPage() {
  return (
    <RoleGate
      mode="page"
      capability="reports.export"
      deniedDescription="Demand notice reports are available to supervisors and administrators."
    >
      <DemandNoticeReportContent />
    </RoleGate>
  );
}
