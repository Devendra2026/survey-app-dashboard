"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetGps } from "@/hooks/surveys/useSurveys";
import { GPS_ACCEPT_MAX_ACCURACY_METERS } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import { fmtDate } from "@/lib/utils";
import type { GpsCapture } from "@/schema/surveys/index";
import { Crosshair, ExternalLink, Loader2, MapPin, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function parseCoordinate(value: string, min: number, max: number): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

function GisPreview({ gps }: { gps: GpsCapture }) {
  const lat = gps.latitude;
  const lng = gps.longitude;
  const accuracyOk = gps.accuracyMeters <= GPS_ACCEPT_MAX_ACCURACY_METERS;

  return (
    <div className="premium-card flex flex-col overflow-hidden rounded-xl border border-border/60 shadow-premium-sm">
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 bg-muted/50 transition-colors duration-200 hover:bg-muted"
      >
        <MapPin className="h-10 w-10 text-primary/70" aria-hidden />
        <span className="text-sm font-semibold text-primary">Open location in Google Maps</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
        <div className="absolute left-3 top-3">
          <Badge variant={accuracyOk ? "default" : "destructive"} className="font-mono text-[10px] uppercase shadow-sm">
            ±{gps.accuracyMeters.toFixed(1)} m
          </Badge>
        </div>
      </a>
      <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50 bg-card">
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Latitude</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{lat.toFixed(6)}</p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Longitude</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{lng.toFixed(6)}</p>
        </div>
        <div className="flex items-center px-3 py-2.5">
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary transition-colors duration-200 hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden /> Maps
          </a>
        </div>
      </div>
    </div>
  );
}

export function GpsEditPanel({ surveyId, gps, canEdit }: { surveyId: string; gps?: GpsCapture; canEdit: boolean }) {
  const setGps = useSetGps();
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [latInput, setLatInput] = useState(gps ? String(gps.latitude) : "");
  const [lngInput, setLngInput] = useState(gps ? String(gps.longitude) : "");

  useEffect(() => {
    if (gps) {
      setLatInput(String(gps.latitude));
      setLngInput(String(gps.longitude));
    }
  }, [gps]);

  async function capture() {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not available in this browser");
      return;
    }
    setCapturing(true);
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
          setCapturing(false);
        }
      },
      (err) => {
        toast.error(err.message);
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function saveManual() {
    const lat = parseCoordinate(latInput, -90, 90);
    const lng = parseCoordinate(lngInput, -180, 180);
    if (lat === null) {
      toast.error("Latitude must be between -90 and 90");
      return;
    }
    if (lng === null) {
      toast.error("Longitude must be between -180 and 180");
      return;
    }
    setSaving(true);
    try {
      await setGps({
        id: surveyId as any,
        gps: {
          latitude: lat,
          longitude: lng,
          accuracyMeters: 5,
          capturedAt: Date.now(),
          provider: "manual",
          isMockLocation: false,
        },
      });
      toast.success("GPS coordinates saved");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    if (gps) return <GisPreview gps={gps} />;
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-14 text-muted-foreground">
        <Crosshair className="h-8 w-8 opacity-30" aria-hidden />
        <p className="text-sm font-medium opacity-60">No GPS captured</p>
      </div>
    );
  }

  const outOfTolerance = gps && gps.accuracyMeters > GPS_ACCEPT_MAX_ACCURACY_METERS;

  return (
    <div className="space-y-4">
      {gps ? (
        <GisPreview gps={gps} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-10 text-muted-foreground">
          <Crosshair className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm font-medium opacity-60">No GPS captured yet</p>
        </div>
      )}

      {gps && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Captured {fmtDate(gps.capturedAt)}</span>
          {gps.provider && <Badge variant="outline">{gps.provider}</Badge>}
          {outOfTolerance && (
            <span className="text-brand-red">
              Beyond ±{GPS_ACCEPT_MAX_ACCURACY_METERS} m — recapture outdoors before submitting.
            </span>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-premium-sm">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Edit coordinates
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gps-latitude" className="text-xs font-semibold">
              Latitude
            </Label>
            <Input
              id="gps-latitude"
              type="number"
              step="0.000001"
              min={-90}
              max={90}
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              className="font-mono tabular-nums"
              placeholder="-90 to 90"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gps-longitude" className="text-xs font-semibold">
              Longitude
            </Label>
            <Input
              id="gps-longitude"
              type="number"
              step="0.000001"
              min={-180}
              max={180}
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              className="font-mono tabular-nums"
              placeholder="-180 to 180"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={capturing}
            onClick={() => void capture()}
            className="cursor-pointer rounded-xl border-brand-navy/25 transition-colors duration-200 hover:bg-brand-navy/5 dark:border-primary/30"
          >
            {capturing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Crosshair className="h-4 w-4" aria-hidden />
            )}
            {gps ? "Recapture" : "Capture"} GPS
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => void saveManual()}
            className="cursor-pointer rounded-xl bg-brand-navy text-white transition-colors duration-200 hover:bg-brand-navy/90 dark:bg-primary dark:hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Save coordinates
          </Button>
        </div>
      </div>
    </div>
  );
}
