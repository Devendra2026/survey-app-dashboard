type ActivityItem = {
  id: string;
  type: "survey" | "qc" | "approval" | "user";
  title: string;
  subtitle?: string;
  timestamp: number;
};

/** Build activity feed from survey list data */
export function buildActivityFeed(
  surveys: Array<{
    _id: string;
    propertyId?: string;
    parcelNo?: string;
    status: string;
    qcStatus: string;
    _creationTime: number;
    submittedAt?: number;
    surveyor?: { name?: string };
  }>,
  limit = 8,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const s of surveys) {
    const surveyorName = s.surveyor?.name;
    const label = s.propertyId || `Parcel ${s.parcelNo ?? "—"}`;
    if (s.qcStatus === "approved") {
      items.push({
        id: `${s._id}-approved`,
        type: "approval",
        title: `${label} approved`,
        subtitle: surveyorName,
        timestamp: s.submittedAt ?? s._creationTime,
      });
    } else if (s.qcStatus === "rejected") {
      items.push({
        id: `${s._id}-rejected`,
        type: "qc",
        title: `${label} rejected`,
        subtitle: surveyorName,
        timestamp: s.submittedAt ?? s._creationTime,
      });
    } else if (s.status === "submitted") {
      items.push({
        id: `${s._id}-submitted`,
        type: "survey",
        title: `${label} submitted for QC`,
        subtitle: surveyorName,
        timestamp: s.submittedAt ?? s._creationTime,
      });
    } else if (s.status === "draft") {
      items.push({
        id: `${s._id}-draft`,
        type: "survey",
        title: `${label} draft saved`,
        subtitle: surveyorName,
        timestamp: s._creationTime,
      });
    }
  }

  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
