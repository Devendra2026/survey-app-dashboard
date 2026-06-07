"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExternalLink, Layers, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type GisPoint = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  status: string;
  qcStatus: string;
  href: string;
};

const statusDot: Record<string, string> = {
  draft: "bg-slate-400",
  submitted: "bg-brand-navy",
  approved: "bg-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-rose-500",
};

function projectToGrid(points: GisPoint[], width: number, height: number): Array<GisPoint & { x: number; y: number }> {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;
  const pad = 12;

  return points.map((p) => ({
    ...p,
    x: pad + ((p.longitude - minLng) / lngRange) * (width - pad * 2),
    y: pad + (1 - (p.latitude - minLat) / latRange) * (height - pad * 2),
  }));
}

export function GisSurveyMap({
  surveys,
  loading,
  className,
  height = 320,
}: {
  surveys?: Array<{
    _id: string;
    propertyId?: string;
    parcelNo?: string;
    status: string;
    qcStatus: string;
    gps?: { latitude: number; longitude: number };
  }>;
  loading?: boolean;
  className?: string;
  height?: number;
}) {
  const points = useMemo<GisPoint[]>(() => {
    if (!surveys) return [];
    return surveys
      .filter((s) => s.gps?.latitude && s.gps?.longitude)
      .slice(0, 120)
      .map((s) => ({
        id: s._id,
        label: s.propertyId || `Parcel ${s.parcelNo ?? "—"}`,
        latitude: s.gps!.latitude,
        longitude: s.gps!.longitude,
        status: s.status,
        qcStatus: s.qcStatus,
        href: `/surveys/${s._id}`,
      }));
  }, [surveys]);

  const projected = useMemo(() => projectToGrid(points, 600, height), [points, height]);
  const center = points[0];

  return (
    <GlassCard padding="md" className={className}>
      <GlassCardHeader
        title="GIS Survey Tracking"
        description={`${points.length} geolocated surveys in view`}
        icon={<Navigation className="h-4 w-4" aria-hidden />}
        action={
          center ? (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
              <a
                href={`https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}#map=16/${center.latitude}/${center.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                OpenStreetMap
              </a>
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <Skeleton className="w-full rounded-xl" style={{ height }} aria-busy="true" aria-label="Loading map" />
      ) : points.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-center"
          style={{ height }}
        >
          <MapPin className="mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">No GPS coordinates in current scope</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Surveys with captured GPS will appear here</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border/50" style={{ height }}>
          {/* Grid background */}
          <div className="brand-pixel-pattern absolute inset-0" aria-hidden />
          <div
            className="absolute inset-0 bg-gradient-to-br from-brand-navy/5 via-transparent to-brand-red/6"
            aria-hidden
          />

          <svg
            viewBox={`0 0 600 ${height}`}
            className="relative h-full w-full"
            preserveAspectRatio="xMidYMid slice"
            aria-label="GIS survey point map"
          >
            {projected.map((p) => {
              const dotClass = statusDot[p.qcStatus] ?? statusDot[p.status] ?? "bg-primary";
              return (
                <g key={p.id}>
                  <circle cx={p.x} cy={p.y} r="10" className="fill-current opacity-20 text-primary" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className={cn("stroke-background stroke-2", dotClass.replace("bg-", "fill-"))}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {(["pending", "approved", "rejected", "draft"] as const).map((s) => (
              <Badge key={s} variant="outline" className="gap-1 bg-background/80 text-[10px] backdrop-blur-sm">
                <span className={cn("h-2 w-2 rounded-full", statusDot[s])} aria-hidden />
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {points.length > 0 && (
        <div className="mt-3 max-h-28 space-y-1 overflow-y-auto">
          {points.slice(0, 5).map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted/50"
            >
              <span className="truncate font-medium">{p.label}</span>
              <span className="shrink-0 font-mono text-muted-foreground">
                {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
              </span>
            </Link>
          ))}
          {points.length > 5 && (
            <p className="px-2 text-[10px] text-muted-foreground">+{points.length - 5} more on map</p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Layers className="h-3 w-3" aria-hidden />
        Relative projection · OpenStreetMap compatible coordinates
      </div>
    </GlassCard>
  );
}
