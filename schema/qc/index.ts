/** QC feature DTOs. */
import type { Id } from "@/convex/_generated/dataModel";

export type QcDecision = "approve" | "reject";

export interface QcRemarkWithAuthor {
  _id: Id<"qcRemarks">;
  _creationTime: number;
  surveyId: Id<"surveys">;
  message: string;
  authorRole: string;
  taggedSections: string[];
  status: "open" | "resolved";
  author: { _id: Id<"users">; name: string; role: string } | null;
}

const QC_TAGGABLE_SECTIONS = [
  "property",
  "owner",
  "address",
  "taxation",
  "floors",
  "services",
  "gis",
  "photos",
] as const;
export type QcSection = (typeof QC_TAGGABLE_SECTIONS)[number];
