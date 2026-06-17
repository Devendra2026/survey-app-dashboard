"use client";

import { ExecutiveHero } from "@/components/design-system/executive-hero";
import { formatReportDocumentDate, reportDocumentTimestamp } from "@/lib/qc/report-dates";
import { ShieldCheck } from "lucide-react";

export function QcFinalReportPanelHero() {
  const reportDate = formatReportDocumentDate(reportDocumentTimestamp());

  return (
    <ExecutiveHero
      eyebrow="Reports"
      title="QC Final Report"
      description={`Ward-wise register of QC-approved properties. Report date: ${reportDate}.`}
      icon={ShieldCheck}
      gradient="brand"
    />
  );
}
