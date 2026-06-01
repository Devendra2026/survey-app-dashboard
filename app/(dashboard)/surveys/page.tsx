"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { SurveyExcelActions } from "@/components/surveys/survey-excel-actions";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { useMasters } from "@/hooks/masters/useMasters";
import { searchSurveys, useSurveyListPaginated } from "@/hooks/surveys/useSurveys";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { buildUlbCodeMap } from "@/lib/survey/resolve-display-property-id";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SurveysPage() {
  const { masters } = useMasters();
  const ulbCodes = useMemo(() => buildUlbCodeMap(masters?.ulbs), [masters?.ulbs]);
  const [filters, setFilters] = useState<FilterState>({ search: "" });
  const [pageSize, setPageSize] = useState(20);

  const listFilters = useMemo(
    () => ({
      status: filters.status as SurveyStatus | undefined,
      qcStatus: filters.qcStatus as QcStatus | undefined,
      wardNo: filters.wardNo,
      districtId: filters.districtId,
      municipalityId: filters.municipalityId,
    }),
    [filters],
  );

  const {
    surveys,
    isLoading,
    pageNumber,
    pageSize: rowsPerPage,
    canGoPrev,
    canGoNext,
    goNext,
    goPrev,
  } = useSurveyListPaginated(listFilters, pageSize);

  const filtered = useMemo(
    () => (surveys ? searchSurveys(surveys as any, filters.search, ulbCodes) : surveys),
    [surveys, filters.search, ulbCodes],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Surveys"
        description="All property surveys within your assigned scope, sorted by Property ID."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RoleGate
              capability="reports.export"
              fallback={<SurveyExcelActions filters={listFilters} disabled={isLoading} />}
            >
              <SurveyExcelActions filters={listFilters} canImport disabled={isLoading} />
            </RoleGate>
            <RoleGate capability="surveys.editDraft">
              <Button asChild>
                <Link href="/surveys/new">
                  <Plus className="h-4 w-4" /> New Survey
                </Link>
              </Button>
            </RoleGate>
          </div>
        }
      />
      <SurveyFilters value={filters} onChange={setFilters} />
      <SurveyTable rows={isLoading ? undefined : (filtered as any)} />
      <TablePagination
        pageNumber={pageNumber}
        pageSize={rowsPerPage}
        itemCount={filtered?.length ?? 0}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={goPrev}
        onNext={goNext}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
