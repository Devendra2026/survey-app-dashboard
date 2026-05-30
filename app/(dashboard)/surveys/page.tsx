"use client";

import { exportSurveysCsv } from "@/components/reports/queries/exporters";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { SurveyFilters, type FilterState } from "@/components/surveys/survey-filters";
import { SurveyTable } from "@/components/surveys/survey-tables";
import { Button } from "@/components/ui/button";
import { searchSurveys, useSurveyList } from "@/hooks/surveys/useSurveys";
import type { QcStatus, SurveyStatus } from "@/lib/domain";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SurveysPage() {
  const [filters, setFilters] = useState<FilterState>({ search: "" });

  const rows = useSurveyList({
    status: filters.status as SurveyStatus | undefined,
    qcStatus: filters.qcStatus as QcStatus | undefined,
    wardNo: filters.wardNo,
    districtId: filters.districtId,
    municipalityId: filters.municipalityId,
  });

  const filtered = useMemo(() => (rows ? searchSurveys(rows as any, filters.search) : rows), [rows, filters.search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Surveys"
        description="All property surveys within your assigned scope."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={!filtered?.length}
              onClick={() => filtered && exportSurveysCsv(filtered as any)}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
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
      <p className="text-xs text-muted-foreground">
        {filtered?.length ?? 0} result{filtered?.length === 1 ? "" : "s"}
      </p>
      <SurveyTable rows={filtered as any} />
    </div>
  );
}
