"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { googleMapsEmbedUrl, googleMapsPlaceUrl } from "@/lib/maps/google-maps";
import { ExternalLink, MapPin } from "lucide-react";

export function GoogleMapEmbed({
  latitude,
  longitude,
  title = "Geo-Tagged Location",
  accuracyMeters,
  className,
}: {
  latitude: number;
  longitude: number;
  title?: string;
  accuracyMeters?: number;
  className?: string;
}) {
  const embedUrl = googleMapsEmbedUrl(latitude, longitude);
  const placeUrl = googleMapsPlaceUrl(latitude, longitude);

  return (
    <GlassCard padding="none" className={className}>
      <GlassCardHeader
        title={title}
        icon={<MapPin className="h-4 w-4" aria-hidden />}
        action={
          <a
            href={placeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-navy transition-colors duration-200 hover:text-brand-red dark:text-primary dark:hover:text-brand-red"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            Open in Google Maps
          </a>
        }
        className="px-5 pt-5"
      />
      <div className="relative aspect-4/3 w-full bg-muted/30">
        <iframe
          title={`Google Map — ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          allowFullScreen
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-brand-navy/90 to-transparent px-4 py-3 dark:from-background/95">
          <p className="font-mono text-xs font-semibold text-white dark:text-foreground">
            {Math.abs(latitude).toFixed(4)}° {latitude >= 0 ? "N" : "S"}, {Math.abs(longitude).toFixed(4)}°{" "}
            {longitude >= 0 ? "E" : "W"}
            {accuracyMeters !== undefined ? ` · ±${accuracyMeters.toFixed(1)} m` : ""}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
