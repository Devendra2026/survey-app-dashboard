/** Report module types. Reports are generated client-side from existing
 *  query data — no backend report functions exist or are needed. */
export type ReportFormat = "pdf" | "excel" | "csv";
export type ReportKind = "survey" | "qc" | "municipality_summary" | "surveyor_performance" | "demand_notice";

export interface ReportScope {
  districtId?: string;
  municipalityId?: string;
  wardNo?: string;
}
