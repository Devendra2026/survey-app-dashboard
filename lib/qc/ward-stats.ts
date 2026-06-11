import type { SurveyRow } from "@/components/surveys/survey-tables";

export type QcWardRow = {
  wardNo: string;
  wardLabel?: string;
  municipalityId?: string;
  city: string;
  pending: number;
  approved: number;
  total: number;
};

export function wardGroupKey(row: Pick<SurveyRow, "municipalityId" | "wardNo">): string {
  return `${row.municipalityId ?? ""}:${row.wardNo}`;
}

/** Aggregate QC counts per ward within the current filter scope. */
export function computeQcWardStats(rows: SurveyRow[], wardLabels?: Map<string, string>): QcWardRow[] {
  const byKey = new Map<string, QcWardRow>();

  for (const row of rows) {
    const key = wardGroupKey(row);
    let entry = byKey.get(key);
    if (!entry) {
      entry = {
        wardNo: row.wardNo,
        wardLabel: wardLabels?.get(row.wardNo),
        municipalityId: row.municipalityId,
        city: row.city,
        pending: 0,
        approved: 0,
        total: 0,
      };
      byKey.set(key, entry);
    }
    entry.total += 1;
    if (row.qcStatus === "pending" && row.status === "submitted") entry.pending += 1;
    if (row.qcStatus === "approved") entry.approved += 1;
  }

  return [...byKey.values()].sort((a, b) => a.wardNo.localeCompare(b.wardNo, undefined, { numeric: true }));
}
