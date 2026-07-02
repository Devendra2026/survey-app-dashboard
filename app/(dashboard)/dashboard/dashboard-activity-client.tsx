"use client";

import { ActivityFeed } from "@/components/design-system/activity-feed";
import { FadeIn } from "@/components/design-system/motion";
import { api } from "@/convex/_generated/api";
import { usePreloadedRecentActivity } from "@/hooks/analytics/useAnalytics";
import { buildActivityFeed } from "@/lib/activity-feed";
import type { Preloaded } from "convex/react";
import { useMemo } from "react";

export function DashboardActivityClient({
  preloadedActivity,
}: {
  preloadedActivity: Preloaded<typeof api.webDashboard.recentActivity>;
}) {
  const recentSurveys = usePreloadedRecentActivity(preloadedActivity);

  const activity = useMemo(
    () => (recentSurveys ? buildActivityFeed(recentSurveys as Parameters<typeof buildActivityFeed>[0]) : []),
    [recentSurveys],
  );

  return (
    <section aria-labelledby="activity-heading" className="border-t border-border/50 pt-6 lg:pt-8">
      <FadeIn delay={0.1}>
        <ActivityFeed items={activity} loading={false} />
      </FadeIn>
    </section>
  );
}
