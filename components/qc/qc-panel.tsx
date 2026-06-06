"use client";

import { QcRemarksThread } from "@/components/qc/qc-remarks-thread";
import { RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAddRemark, useDecide, useQcRemarks, useReopen } from "@/hooks/qc/useQc";
import { parseConvexError } from "@/lib/errors";
import { QC_TAGGABLE_SECTIONS } from "@/schema/qc/index";
import { CheckCircle2, Lock, MessageSquarePlus, Pencil, Unlock, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export function QcPanel({ survey }: { survey: { _id: string; status: string; qcStatus: string } }) {
  const remarks = useQcRemarks(survey._id);
  const decide = useDecide();
  const addRemark = useAddRemark();
  const reopen = useReopen();

  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isApproved = survey.qcStatus === "approved";
  const isPending = survey.qcStatus === "pending" && survey.status === "submitted";
  const isDraft = survey.status === "draft";

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      setComment("");
      setTags([]);
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <RoleGate capability="qc.decide" fallback={null}>
        <Card className="border-l-[3px] border-l-amber-500 bg-amber-50/30 shadow-sm dark:border-l-amber-400 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-100">
              Quality Control Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isDraft && !isApproved && (
              <p className="rounded-lg border border-amber-300/50 bg-amber-100/60 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-100">
                This survey is in <strong>draft</strong> — it must be re-submitted before approval. You can leave
                correction remarks or{" "}
                <Link href={`/surveys/${survey._id}/edit`} className="font-semibold underline">
                  edit directly
                </Link>
                .
              </p>
            )}
            {isApproved && (
              <p className="rounded-lg border border-emerald-300/50 bg-emerald-100/60 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-100">
                Approved and locked against surveyor edits. Use <strong>Reopen</strong> to override if needed.
              </p>
            )}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tag sections (optional)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QC_TAGGABLE_SECTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleTag(s)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs capitalize transition-colors ${
                      tags.includes(s)
                        ? "border-amber-600 bg-amber-600/15 text-amber-800 dark:text-amber-200"
                        : "border-border text-muted-foreground hover:border-amber-400/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Comment / correction note (required for reject & correction)…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[88px] rounded-xl border-amber-200/60 bg-background dark:border-amber-800/40"
            />
            <div className="flex flex-col gap-2">
              {isPending && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    className="flex-1 rounded-full bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
                    onClick={() =>
                      run(
                        () =>
                          decide({
                            surveyId: survey._id,
                            decision: "approve",
                            comment: comment || undefined,
                            taggedSections: tags,
                          }),
                        "Survey approved",
                      )
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={busy || !comment.trim()}
                    className="flex-1 rounded-full"
                    onClick={() =>
                      run(
                        () => decide({ surveyId: survey._id, decision: "reject", comment, taggedSections: tags }),
                        "Survey returned for revision",
                      )
                    }
                  >
                    <XCircle className="h-4 w-4" /> Return
                  </Button>
                </div>
              )}
              <RoleGate capability="qc.requestCorrection" fallback={null}>
                <Button
                  variant="outline"
                  disabled={busy || !comment.trim()}
                  className="w-full rounded-full border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/30"
                  onClick={() =>
                    run(
                      () => addRemark({ surveyId: survey._id, message: comment, taggedSections: tags }),
                      "Correction remark added",
                    )
                  }
                >
                  <MessageSquarePlus className="h-4 w-4" /> Request Correction
                </Button>
              </RoleGate>
              {isApproved && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  className="w-full rounded-full"
                  onClick={() =>
                    run(() => reopen({ surveyId: survey._id, reason: comment || undefined }), "Survey reopened")
                  }
                >
                  <Unlock className="h-4 w-4" /> Reopen (override)
                </Button>
              )}
              {survey.qcStatus !== "approved" && (
                <RoleGate capability="surveys.editDraft" fallback={null}>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-200"
                  >
                    <Link href={`/surveys/${survey._id}/edit`}>
                      <Pencil className="h-4 w-4" /> Edit survey data
                    </Link>
                  </Button>
                </RoleGate>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Return sends the survey to <strong>draft</strong> so the surveyor can fix and resubmit. Approve locks it (
              <Lock className="inline h-3 w-3" />) against surveyor edits.
            </p>
          </CardContent>
        </Card>
      </RoleGate>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            QC Remark Thread
            {remarks && remarks.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {remarks.filter((r) => r.status === "open").length} open
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QcRemarksThread remarks={remarks} />
        </CardContent>
      </Card>
    </div>
  );
}
