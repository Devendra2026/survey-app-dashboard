import { Badge } from "@/components/ui/badge";
import {
  QC_STATUS_LABEL,
  QC_STATUS_TONE,
  SURVEY_STATUS_LABEL,
  SURVEY_STATUS_TONE,
  type QcStatus,
  type SurveyStatus,
} from "@/lib/domain";

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const tone = SURVEY_STATUS_TONE[status];
  return <Badge variant={tone === "default" ? "default" : "outline"}>{SURVEY_STATUS_LABEL[status]}</Badge>;
}

export function QcStatusBadge({ status }: { status: QcStatus }) {
  const tone = QC_STATUS_TONE[status];
  const variant = tone === "destructive" ? "destructive" : tone === "success" ? "default" : "outline";
  return <Badge variant={variant}>{QC_STATUS_LABEL[status]}</Badge>;
}
