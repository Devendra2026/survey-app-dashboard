"use client";

import { RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAddRemark, useDecide, useQcRemarks, useReopen, useResolveRemark } from "@/hooks/qc/useQc";
import { parseConvexError } from "@/lib/errors";
import { fmtDate } from "@/lib/utils";
import { CheckCircle2, Lock, MessageSquarePlus, Unlock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SECTIONS = ["property", "owner", "address", "taxation", "floors", "services", "gis", "photos"];

export function QcPanel({ survey }: { survey: any }) {
  const remarks = useQcRemarks(survey._id);
  const decide = useDecide();
  const addRemark = useAddRemark();
  const resolveRemark = useResolveRemark();
  const reopen = useReopen();

  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isApproved = survey.qcStatus === "approved";
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality Control Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isDraft && (
              <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                This survey is in <strong>draft</strong> — it must be submitted before it can be approved or rejected.
                You can still leave a correction remark.
              </p>
            )}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Tag sections (optional)</p>
              <div className="flex flex-wrap gap-1.5">
                {SECTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleTag(s)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs capitalize transition-colors ${
                      tags.includes(s)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
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
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                disabled={busy || isDraft}
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
                disabled={busy || isDraft || !comment.trim()}
                onClick={() =>
                  run(
                    () => decide({ surveyId: survey._id, decision: "reject", comment, taggedSections: tags }),
                    "Survey rejected & returned for revision",
                  )
                }
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button
                variant="outline"
                disabled={busy || !comment.trim()}
                onClick={() =>
                  run(
                    () => addRemark({ surveyId: survey._id, message: comment, taggedSections: tags }),
                    "Correction remark added",
                  )
                }
              >
                <MessageSquarePlus className="h-4 w-4" /> Request Correction
              </Button>
              {isApproved && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    run(() => reopen({ surveyId: survey._id, reason: comment || undefined }), "Survey reopened")
                  }
                >
                  <Unlock className="h-4 w-4" /> Reopen (override)
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Reject returns the survey to <strong>draft</strong> so the surveyor can fix and resubmit. Approve locks it
              ({<Lock className="inline h-3 w-3" />}) against surveyor edits.
            </p>
          </CardContent>
        </Card>
      </RoleGate>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">QC Remark Thread</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {remarks === undefined && <p className="text-sm text-muted-foreground">Loading…</p>}
          {remarks?.length === 0 && <p className="text-sm text-muted-foreground">No remarks yet.</p>}
          {remarks?.map((r: any) => (
            <div key={r._id} className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.author?.name ?? "Unknown"}</span>
                  <Badge variant="outline">{r.authorRole.charAt(0).toUpperCase() + r.authorRole.slice(1)}</Badge>
                  <Badge variant={r.status === "open" ? "outline" : "default"}>{r.status}</Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">{fmtDate(r._creationTime)}</span>
              </div>
              <p className="text-sm">{r.message}</p>
              {r.status === "open" && (
                <RoleGate capability="qc.decide" fallback={null}>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() => resolveRemark({ id: r._id })}
                  >
                    Mark resolved
                  </Button>
                </RoleGate>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
