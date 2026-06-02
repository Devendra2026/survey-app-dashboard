import { Badge } from "@/components/ui/badge";
import {
  QC_STATUS_LABEL,
  QC_STATUS_TONE,
  SURVEY_STATUS_LABEL,
  SURVEY_STATUS_TONE,
  type QcStatus,
  type SurveyStatus,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const tone = SURVEY_STATUS_TONE[status];
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "destructive"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : tone === "default"
          ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
          : "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
  return (
    <Badge variant="outline" className={cn("font-medium", toneClass)}>
      {SURVEY_STATUS_LABEL[status]}
    </Badge>
  );
}

export function QcStatusBadge({ status }: { status: QcStatus }) {
  const tone = QC_STATUS_TONE[status];
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "destructive"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <Badge variant="outline" className={cn("font-medium", toneClass)}>
      {QC_STATUS_LABEL[status]}
    </Badge>
  );
}
