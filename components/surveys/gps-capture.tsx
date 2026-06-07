"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSetGps } from "@/hooks/surveys/useSurveys";
import { GPS_ACCEPT_MAX_ACCURACY_METERS } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import { fmtDate } from "@/lib/utils";
import type { GpsCapture } from "@/schema/surveys/index";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function GpsCapturePanel({ surveyId, gps }: { surveyId: string; gps?: GpsCapture }) {
  const setGps = useSetGps();
  const [busy, setBusy] = useState(false);

  async function capture() {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not available in this browser");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await setGps({
            id: surveyId as any,
            gps: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracyMeters: Math.round(pos.coords.accuracy),
              capturedAt: Date.now(),
              provider: "browser",
              isMockLocation: false,
            },
          });
          toast.success("GPS captured");
        } catch (e) {
          toast.error(parseConvexError(e).message);
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        toast.error(err.message);
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const outOfTolerance = gps && gps.accuracyMeters > GPS_ACCEPT_MAX_ACCURACY_METERS;

  return (
    <GlassCard padding="md">
      <GlassCardHeader
        title="GPS Capture"
        description="Property coordinates are required before QC submission."
        icon={<MapPin className="h-4 w-4" aria-hidden />}
      />
      <div className="space-y-4">
        {gps ? (
          <div className="premium-card space-y-2 rounded-xl border border-border/60 p-4 shadow-premium-sm">
            <p className="flex items-center gap-2 font-mono text-sm font-semibold tabular-nums text-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-brand-navy dark:text-primary" aria-hidden />
              {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Accuracy</span>
              <Badge variant={outOfTolerance ? "destructive" : "outline"} className="font-mono text-[10px]">
                ±{gps.accuracyMeters} m
              </Badge>
              <span className="text-xs">{fmtDate(gps.capturedAt)}</span>
            </div>
            {outOfTolerance && (
              <p className="text-xs text-brand-red">
                Beyond ±{GPS_ACCEPT_MAX_ACCURACY_METERS} m — recapture outdoors before submitting.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No GPS captured yet. Required before submit.
          </p>
        )}
        <Button
          variant="outline"
          disabled={busy}
          onClick={capture}
          className="cursor-pointer rounded-xl border-brand-navy/25 hover:bg-brand-navy/5 dark:border-primary/30"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Crosshair className="h-4 w-4" aria-hidden />
          )}
          {gps ? "Recapture" : "Capture"} GPS
        </Button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Uses this device&apos;s location. For field capture, use the mobile app.
        </p>
      </div>
    </GlassCard>
  );
}
