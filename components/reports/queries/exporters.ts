"use client";

import * as XLSX from "xlsx";
import { SURVEY_STATUS_LABEL, QC_STATUS_LABEL, type SurveyStatus, type QcStatus } from "@/lib/domain";
import { fmtDate } from "@/lib/utils";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

interface ExportableSurvey {
  propertyId?: string;
  parcelNo: string;
  unitNo?: string;
  respondentName?: string;
  mobileNo: string;
  wardNo: string;
  city: string;
  locality?: string;
  colonyName?: string;
  pinCode?: string;
  assessmentYear?: string;
  ownershipType?: string;
  propertyUse?: string;
  plotSqft?: number;
  plinthSqft?: number;
  status: SurveyStatus;
  qcStatus: QcStatus;
  _creationTime: number;
  submittedAt?: number;
}

function surveyToRecord(s: ExportableSurvey) {
  return {
    "Property ID": s.propertyId ?? "",
    "Parcel No": s.parcelNo,
    "Unit No": s.unitNo ?? "",
    Owner: s.respondentName ?? "",
    Mobile: s.mobileNo,
    Ward: s.wardNo,
    ULB: s.city,
    Locality: s.locality ?? "",
    Colony: s.colonyName ?? "",
    PIN: s.pinCode ?? "",
    "Assessment Year": s.assessmentYear ?? "",
    Ownership: s.ownershipType ?? "",
    "Property Use": s.propertyUse ?? "",
    "Plot (sqft)": s.plotSqft ?? "",
    "Plinth (sqft)": s.plinthSqft ?? "",
    Status: SURVEY_STATUS_LABEL[s.status],
    "QC Status": QC_STATUS_LABEL[s.qcStatus],
    Created: fmtDate(s._creationTime),
    Submitted: s.submittedAt ? fmtDate(s.submittedAt) : "",
  };
}

export function exportSurveysCsv(surveys: ExportableSurvey[]) {
  const ws = XLSX.utils.json_to_sheet(surveys.map(surveyToRecord));
  const csv = XLSX.utils.sheet_to_csv(ws);
  download(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `surveys_${stamp()}.csv`);
}

export function exportSurveysExcel(surveys: ExportableSurvey[]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(surveys.map(surveyToRecord));
  XLSX.utils.book_append_sheet(wb, ws, "Surveys");
  XLSX.writeFile(wb, `surveys_${stamp()}.xlsx`);
}

/** Multi-sheet workbook for the analytics breakdown (Municipality Summary). */
export function exportBreakdownExcel(breakdown: { byDistrict: any[]; byUlb: any[]; bySurveyor: any[]; summary: any }) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([breakdown.summary]), "Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(breakdown.byDistrict), "By District");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(breakdown.byUlb), "By ULB");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(breakdown.bySurveyor), "By Surveyor");
  XLSX.writeFile(wb, `municipality_summary_${stamp()}.xlsx`);
}
