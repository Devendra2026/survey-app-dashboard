"use client";

import { PageTransition } from "@/components/design-system/motion";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { SurveyReassignDialog } from "@/components/surveys/survey-reassign-dialog";
import { SurveyTable } from "@/components/surveys/survey-tables";
import {
  SurveysFiltersSection,
  SurveysMetricsSection,
  SurveysPageHero,
  SurveysRegistrySection,
} from "@/components/surveys/surveys-page-sections";
import { useSurveysPage } from "@/hooks/surveys/useSurveysPage";

export default function SurveysPage() {
  const {
    canViewAll,
    canReassign,
    reassignOpen,
    setReassignOpen,
    listFilters,
    filters,
    dispatchListUi,
    surveyorOptions,
    registrySearch,
    setRegistrySearch,
    isLoading,
    pagedRows,
    pageNumber,
    pageStart,
    canGoPrev,
    canGoNext,
    goNext,
    goPrev,
    pageSize,
    activeTab,
    stats,
    draftCount,
    submittedCount,
    metricsReady,
    showAnalytics,
  } = useSurveysPage();

  return (
    <RoleGate
      mode="page"
      anyOf={["surveys.viewOwn", "surveys.viewAssigned", "surveys.viewAll"]}
      deniedDescription="The Surveys module is for field surveyors and supervisors. QC staff should use the QC Portal."
      redirectTo="/qc"
    >
      <PageTransition className="space-y-6 lg:space-y-8">
        <SurveysPageHero
          canReassign={canReassign}
          listFilters={listFilters}
          isLoading={isLoading}
          onReassignOpen={() => setReassignOpen(true)}
        />

        <SurveysMetricsSection
          stats={stats}
          draftCount={draftCount}
          metricsReady={metricsReady}
          showAnalytics={showAnalytics}
        />

        <SurveysFiltersSection
          filters={filters}
          onFiltersChange={(next) => dispatchListUi({ type: "setFilters", value: next })}
          surveyorOptions={canViewAll ? surveyorOptions : undefined}
        />

        <SurveysRegistrySection
          activeTab={activeTab}
          onActiveTabChange={(tab) => dispatchListUi({ type: "setActiveTab", value: tab })}
          stats={stats}
          draftCount={draftCount}
          submittedCount={submittedCount}
          pageNumber={pageNumber}
          pageStart={pageStart}
          canGoNext={canGoNext}
          isLoading={isLoading}
          pagedRows={pagedRows as Parameters<typeof SurveyTable>[0]["rows"]}
          showSurveyor={canViewAll}
          registrySearch={registrySearch}
          onRegistrySearchChange={setRegistrySearch}
        />

        <TablePagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          itemCount={pagedRows?.length ?? 0}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={goPrev}
          onNext={goNext}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={(size) => dispatchListUi({ type: "setPageSize", value: size })}
        />

        <SurveyReassignDialog
          open={reassignOpen}
          onOpenChange={setReassignOpen}
          scope={{
            districtId: filters.districtId,
            municipalityId: filters.municipalityId,
            wardNo: filters.wardNo,
          }}
        />
      </PageTransition>
    </RoleGate>
  );
}
