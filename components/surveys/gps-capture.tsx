"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSetGps } from "@/hooks/surveys/useSurveys";
import { GPS_ACCEPT_MAX_ACCURACY_METERS } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import { fmtDate } from "@/lib/utils";
import type { GpsCapture } from "@/schema/surveys/index";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">GPS Capture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {gps ? (
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              Accuracy <Badge variant={outOfTolerance ? "destructive" : "default"}>±{gps.accuracyMeters} m</Badge>
              <span className="text-xs">{fmtDate(gps.capturedAt)}</span>
            </p>
            {outOfTolerance && (
              <p className="text-xs text-destructive">
                Beyond ±{GPS_ACCEPT_MAX_ACCURACY_METERS} m — recapture outdoors before submitting.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No GPS captured yet. Required before submit.</p>
        )}
        <Button variant="outline" disabled={busy} onClick={capture}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}{" "}
          {gps ? "Recapture" : "Capture"} GPS
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Uses this device&apos;s location. For field capture, use the mobile app.
        </p>
      </CardContent>
    </Card>
  );
}
