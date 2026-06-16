"use client";

import { PageTransition } from "@/components/design-system/motion";
import { QcRegistryHero, QcReviewRegistry, QcScopeBanner } from "@/components/qc/qc-queue-sections";
import { QcPageSkeleton } from "@/components/shared/qc-route-skeleton";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { useQcQueue } from "@/hooks/qc/useQcQueue";
import { QC_TABLE_PAGE_SIZE_OPTIONS } from "@/lib/table-pagination";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function QcRegistryContent() {
  const searchParams = useSearchParams();
  const wardFromUrl = searchParams.get("wardNo") ?? undefined;
  const muniFromUrl = searchParams.get("municipalityId") ?? undefined;
  const districtFromUrl = searchParams.get("districtId") ?? undefined;
  const tabFromUrl = searchParams.get("tab") ?? undefined;

  const {
    scope,
    activeTab,
    pageNumber,
    pageSize,
    pageStart,
    isLoading,
    stats,
    rejectedCount,
    parcelSharedCount,
    parcelSiblingIndex,
    filteredCount,
    pagedRows,
    registrySearch,
    canGoPrev,
    canGoNext,
    patchScope,
    handleRegistrySearchChange,
    handleTabChange,
    handlePageSizeChange,
    goNext,
    goPrev,
  } = useQcQueue({ mode: "registry", initialTab: tabFromUrl ?? "active" });

  useEffect(() => {
    if (!wardFromUrl && !muniFromUrl && !districtFromUrl) return;
    patchScope({
      wardNo: wardFromUrl ?? scope.wardNo,
      municipalityId: muniFromUrl ?? scope.municipalityId,
      districtId: districtFromUrl ?? scope.districtId,
    });
  }, [wardFromUrl, muniFromUrl, districtFromUrl, patchScope, scope.districtId, scope.municipalityId, scope.wardNo]);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      handleTabChange(tabFromUrl);
    }
  }, [tabFromUrl, activeTab, handleTabChange]);

  return (
    <PageTransition className="space-y-6 lg:space-y-8">
      <QcRegistryHero />
      <QcScopeBanner scope={scope} />
      <QcReviewRegistry
        stats={stats}
        rejectedCount={rejectedCount}
        parcelSharedCount={parcelSharedCount}
        parcelSiblingIndex={parcelSiblingIndex}
        activeTab={activeTab}
        filteredCount={filteredCount}
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
        itemCount={pagedRows?.length ?? 0}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={goPrev}
        onNext={goNext}
        pageSizeOptions={[...QC_TABLE_PAGE_SIZE_OPTIONS]}
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
      <Suspense fallback={<QcPageSkeleton variant="registry" />}>
        <QcRegistryContent />
      </Suspense>
    </RoleGate>
  );
}
