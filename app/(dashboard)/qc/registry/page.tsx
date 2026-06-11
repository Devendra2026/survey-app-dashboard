"use client";

import { PageTransition } from "@/components/design-system/motion";
import { QcRegistryHero, QcReviewRegistry, QcScopeBanner } from "@/components/qc/qc-queue-sections";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { useQcQueue } from "@/hooks/qc/useQcQueue";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function QcRegistryContent() {
  const searchParams = useSearchParams();
  const wardFromUrl = searchParams.get("wardNo") ?? undefined;
  const muniFromUrl = searchParams.get("municipalityId") ?? undefined;
  const districtFromUrl = searchParams.get("districtId") ?? undefined;

  const {
    scope,
    activeTab,
    pageNumber,
    pageSize,
    pageStart,
    isLoading,
    stats,
    rejectedCount,
    filteredByTab,
    pagedRows,
    registrySearch,
    canGoPrev,
    canGoNext,
    patchScope,
    handleRegistrySearchChange,
    handleTabChange,
    handlePageSizeChange,
    setPageNumber,
  } = useQcQueue();

  useEffect(() => {
    if (!wardFromUrl && !muniFromUrl && !districtFromUrl) return;
    patchScope({
      wardNo: wardFromUrl ?? scope.wardNo,
      municipalityId: muniFromUrl ?? scope.municipalityId,
      districtId: districtFromUrl ?? scope.districtId,
    });
  }, [wardFromUrl, muniFromUrl, districtFromUrl, patchScope, scope.districtId, scope.municipalityId, scope.wardNo]);

  return (
    <PageTransition className="space-y-6 lg:space-y-8">
      <QcRegistryHero />
      <QcScopeBanner scope={scope} />
      <QcReviewRegistry
        stats={stats}
        rejectedCount={rejectedCount}
        activeTab={activeTab}
        filteredCount={filteredByTab.length}
        isLoading={isLoading}
        rows={pagedRows}
        pageStart={pageStart}
        registrySearch={registrySearch}
        onRegistrySearchChange={handleRegistrySearchChange}
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
  );
}

export default function QcRegistryPage() {
  return (
    <RoleGate
      mode="page"
      capability="qc.review"
      deniedDescription="Quality Control is available to QC supervisors and administrators."
    >
      <Suspense>
        <QcRegistryContent />
      </Suspense>
    </RoleGate>
  );
}
