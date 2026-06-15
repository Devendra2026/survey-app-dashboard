import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { clientError } from "../helpers";
import { normalizeParcelKey } from "../propertyId";

function wardNumbersMatch(rowWard: string, filterWard: string): boolean {
  if (rowWard === filterWard) return true;
  const a = Number(rowWard);
  const b = Number(filterWard);
  return !Number.isNaN(a) && !Number.isNaN(b) && a === b;
}

/** Reject duplicate Property IDs and duplicate ward + parcel + use + unit slots. */
export async function assertUniqueSurveySlot(
  ctx: MutationCtx,
  input: {
    municipalityId: Id<"municipalities">;
    wardNo: string;
    parcelNo: string;
    propertyUse?: string;
    unitNo?: string;
    propertyId?: string;
    excludeId?: Id<"surveys">;
  },
): Promise<void> {
  const propertyId = input.propertyId?.trim().toUpperCase();
  if (propertyId) {
    const byPropertyId = await ctx.db
      .query("surveys")
      .withIndex("by_property_id", (q) => q.eq("propertyId", propertyId))
      .first();
    if (byPropertyId && byPropertyId._id !== input.excludeId) {
      clientError("CONFLICT", "A survey with this Property ID already exists", {
        propertyId: ["duplicate property ID"],
      });
    }
  }

  const parcelKey = normalizeParcelKey(input.parcelNo);
  const unitKey = (input.unitNo ?? "").trim();
  const useKey = (input.propertyUse ?? "").trim();

  const wardVariants = new Set([input.wardNo.trim()]);
  const wardNum = Number(input.wardNo);
  if (!Number.isNaN(wardNum)) {
    wardVariants.add(String(wardNum));
    wardVariants.add(String(wardNum).padStart(2, "0"));
  }

  const wardRows: Doc<"surveys">[] = [];
  for (const ward of wardVariants) {
    const batch = await ctx.db
      .query("surveys")
      .withIndex("by_municipality_ward", (q) => q.eq("municipalityId", input.municipalityId).eq("wardNo", ward))
      .collect();
    for (const row of batch) {
      if (!wardRows.some((existing) => existing._id === row._id)) wardRows.push(row);
    }
  }

  for (const row of wardRows) {
    if (row._id === input.excludeId) continue;
    if (!wardNumbersMatch(row.wardNo, input.wardNo)) continue;
    if (normalizeParcelKey(row.parcelNo) !== parcelKey) continue;
    if ((row.propertyUse ?? "").trim() !== useKey) continue;
    if ((row.unitNo ?? "").trim() !== unitKey) continue;
    clientError("CONFLICT", "A survey already exists for this ward, parcel, unit, and property use", {
      parcelNo: ["duplicate parcel in this ward"],
      unitNo: ["duplicate unit for this parcel"],
      propertyUse: ["duplicate property use for this parcel"],
    });
  }
}

export type SurveySlotInput = Pick<
  Doc<"surveys">,
  "municipalityId" | "wardNo" | "parcelNo" | "propertyUse" | "unitNo" | "propertyId"
>;
