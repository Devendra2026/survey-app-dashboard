/** Analytics DTOs (analytics.surveyStatsBreakdown + analyticsTrends + dashboardCounts). */
import type { Id } from "@/convex/_generated/dataModel";

export interface SurveyCounts {
  total: number;
  today: number;
  drafts: number;
  submitted: number;
  approved: number;
  rejected: number;
}

/** Home dashboard KPI row from `masters.dashboardCounts`. */
export interface DashboardCounts {
  total: number;
  /** Surveys created today (any status). */
  today: number;
  drafts: number;
  pending: number;
  /** Surveys submitted today (status submitted, by submittedAt). */
  submittedToday: number;
  approved: number;
  /** All surveys currently in submitted status. */
  submitted: number;
  rejected: number;
}

export interface DistrictBreakdown extends SurveyCounts {
  districtId: Id<"districts">;
  code: string;
  name: string;
}
export interface UlbBreakdown extends SurveyCounts {
  municipalityId: Id<"municipalities">;
  code: string;
  name: string;
  districtId: Id<"districts">;
  districtName: string;
}
export interface SurveyorBreakdown extends SurveyCounts {
  surveyorId: Id<"users">;
  name: string;
  email: string;
  municipalityName: string | null;
  districtName: string | null;
  status: "active";
}

export interface QcSupervisorBreakdown {
  reviewerId: Id<"users">;
  name: string;
  email: string;
  approved: number;
  rejected: number;
  total: number;
}

export interface StatsBreakdown {
  summary: SurveyCounts;
  byDistrict: DistrictBreakdown[];
  byUlb: UlbBreakdown[];
  bySurveyor: SurveyorBreakdown[];
  byQcSupervisor: QcSupervisorBreakdown[];
  filterOptions: {
    districts: { _id: Id<"districts">; code: string; name: string }[];
    municipalities: { _id: Id<"municipalities">; code: string; name: string; districtId: Id<"districts"> }[];
    surveyors: { _id: Id<"users">; name: string; email: string }[];
    qcSupervisors: { _id: Id<"users">; name: string; email: string }[];
  };
}

export interface DailyTrendPoint {
  date: string;
  created: number;
  submitted: number;
  approved: number;
  rejected: number;
}
export interface WardCoverageRow {
  municipalityId: Id<"municipalities">;
  municipalityName: string;
  wardNo: string;
  total: number;
  approved: number;
  approvalRate: number;
}

/** Combined home dashboard payload from `webDashboard.homeBundle`. */
export interface WebDashboardAnalytics {
  breakdown: StatsBreakdown;
  dailyTrend: DailyTrendPoint[];
  wardCoverage: WardCoverageRow[];
}

export interface WebDashboardBundle {
  counts: DashboardCounts;
  analytics: WebDashboardAnalytics | null;
}
