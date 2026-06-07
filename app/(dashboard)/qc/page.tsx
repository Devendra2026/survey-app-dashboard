"use client";

import { PageTransition } from "@/components/design-system/motion";
import {
  QcFiltersSection,
  QcMetricsSection,
  QcPendingAlert,
  QcPipelineSection,
  QcQueueHero,
  QcReviewRegistry,
} from "@/components/qc/qc-queue-sections";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { useQcQueue } from "@/hooks/qc/useQcQueue";

export default function QcQueuePage() {
  const {
    filters,
    activeTab,
    pageNumber,
    pageSize,
    isLoading,
    stats,
    nextPending,
    pipelineStage,
    filteredByTab,
    pagedRows,
    canGoPrev,
    canGoNext,
    handleFiltersChange,
    handleTabChange,
    handlePageSizeChange,
    setPageNumber,
  } = useQcQueue();

  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control is available to supervisors and administrators."
    >
      <PageTransition className="space-y-6 lg:space-y-8">
        <QcQueueHero nextPendingId={nextPending?._id} />
        <QcPendingAlert stats={stats} nextPendingId={nextPending?._id} />
        <QcMetricsSection stats={stats} isLoading={isLoading} />
        <QcPipelineSection stats={stats} pipelineStage={pipelineStage} onStageClick={handleTabChange} />
        <QcFiltersSection filters={filters} onChange={handleFiltersChange} />
        <QcReviewRegistry
          stats={stats}
          activeTab={activeTab}
          filteredCount={filteredByTab.length}
          isLoading={isLoading}
          rows={pagedRows}
          onTabChange={handleTabChange}
        />
        <TablePagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          itemCount={filteredByTab.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => setPageNumber((p) => Math.max(1, p - 1))}
          onNext={() => setPageNumber((p) => (canGoNext ? p + 1 : p))}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={handlePageSizeChange}
        />
      </PageTransition>
    </RoleGate>
  );
}
