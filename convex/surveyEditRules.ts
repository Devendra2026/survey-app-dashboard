/**
 * Survey edit lifecycle — who can write, how rows are resolved, and post-save status.
 *
 * Two independent axes:
 *  - `status`     — surveyor workflow (draft → submitted → approved)
 *  - `qcStatus`   — supervisor decision (pending → approved | rejected)
 *
 * QC rejection sets status back to draft while qcStatus stays rejected so the
 * surveyor can fix and resubmit. While a survey sits in the QC queue
 * (submitted + pending), both the assigned surveyor and supervisors may save
 * corrections without pulling it out of review.
 */
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { clientError } from "./helpers";
import { assertMunicipalityInScope } from "./tenancy";

export function assertSurveyWritable(me: Doc<"users">, survey: Doc<"surveys">): void {
  if (survey.qcStatus === "approved" && me.role === "surveyor") {
    clientError("LOCKED", "This survey is locked — request your supervisor to re-open it");
  }
}

/** Status axes after a successful save — never implicitly resubmit or approve. */
export function resolvePostSaveStatuses(existing: Doc<"surveys">): Pick<Doc<"surveys">, "status" | "qcStatus"> {
  if (existing.qcStatus === "approved") {
    // Supervisor/admin edit re-queues for QC without changing the surveyor assignment.
    return { status: "submitted", qcStatus: "pending" };
  }

  if (existing.status === "submitted" && existing.qcStatus === "pending") {
    return { status: "submitted", qcStatus: "pending" };
  }

  if (existing.status === "draft" && existing.qcStatus === "rejected") {
    return { status: "draft", qcStatus: "rejected" };
  }

  return { status: "draft", qcStatus: existing.qcStatus };
}

export function auditActionForSave(existing: Doc<"surveys"> | null, editor: Doc<"users">, isNewDraft: boolean): string {
  if (!existing || isNewDraft) return isNewDraft ? "survey.created" : "survey.draft_saved";
  if (existing.status === "submitted" && existing.qcStatus === "pending") {
    return editor.role === "surveyor" ? "survey.edited_in_review" : "survey.qc_corrected";
  }
  if (existing.status === "draft" && existing.qcStatus === "rejected") {
    return "survey.corrected";
  }
  if (existing.status === "draft") return "survey.draft_saved";
  return "survey.updated";
}

/**
 * Resolve the survey row being edited.
 *
 * Mobile surveyors sync via `localId`. Web editors (especially supervisors doing
 * QC corrections) must pass `id` so we don't create a duplicate row keyed to
 * the supervisor's surveyorId.
 */
export async function resolveExistingSurveyForSave(
  ctx: MutationCtx,
  me: Doc<"users">,
  args: { id?: Id<"surveys">; localId: string; municipalityId: Id<"municipalities"> },
): Promise<Doc<"surveys"> | null> {
  if (args.id) {
    const survey = await ctx.db.get(args.id);
    if (!survey) clientError("NOT_FOUND", "Survey not found");
    await assertMunicipalityInScope(ctx, me, survey.municipalityId);
    if (me.role === "surveyor" && survey.surveyorId !== me._id) {
      clientError("FORBIDDEN", "Not your survey");
    }
    if (survey.localId !== args.localId) {
      clientError("BAD_REQUEST", "Survey identity mismatch");
    }
    return survey;
  }

  if (me.role === "surveyor") {
    return await ctx.db
      .query("surveys")
      .withIndex("by_surveyor_localId", (q) => q.eq("surveyorId", me._id).eq("localId", args.localId))
      .unique();
  }

  return null;
}
