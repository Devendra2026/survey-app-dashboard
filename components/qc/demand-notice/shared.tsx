import type { DemandNoticeData } from "@/lib/qc/demand-notice";

/** Official Uttar Pradesh government emblem for demand notice letterhead. */
export const DEMAND_NOTICE_GOVT_LOGO = "/govt-of-up-logo.png";

export function pctLabel(val: number): string {
  return `${(val * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export function rateSourceCaption(notice: DemandNoticeData): string {
  const zone = notice.masterBaseRate?.zoneLabel;
  if (notice.rateSource === "ward") {
    return zone
      ? `Ward ${notice.masterBaseRate!.wardNo} · ${zone} · ward master data`
      : `Ward ${notice.masterBaseRate?.wardNo ?? "—"} · ward master data`;
  }
  if (notice.rateSource === "ulb") {
    return zone ? `${zone} · ULB master data` : "ULB master data";
  }
  return "System default rates";
}

export function ulbInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ULB";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
}
