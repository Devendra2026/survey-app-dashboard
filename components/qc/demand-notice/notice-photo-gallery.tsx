"use client";

import { googleMapsEmbedUrl, googleMapsStaticUrl } from "@/lib/maps/google-maps";
import type { SurveyDetail } from "@/schema/surveys/index";
import { ImageOff, MapPin } from "lucide-react";
import Image from "next/image";
import { BilingualLabel, SectionLabel } from "./shared";

function GalleryPhoto({ url, label }: { url?: string | null; label: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-(--dn-border) bg-white print:rounded-none print:border-black">
      <div className="demand-notice-photo-frame relative aspect-4/3 w-full bg-muted/20 sm:aspect-square print:aspect-auto">
        {url ? (
          <Image src={url} alt={label} fill unoptimized sizes="280px" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-8 w-8 opacity-40 print:h-4 print:w-4" aria-hidden />
            <p className="text-xs font-medium opacity-60 print:text-[6px]">No photo</p>
          </div>
        )}
      </div>
      <figcaption className="demand-notice-print-hide border-t border-(--dn-border) px-3 py-2 text-center text-xs font-semibold text-(--dn-primary)">
        {label}
      </figcaption>
    </figure>
  );
}

export function NoticePhotoGallery({
  survey,
  frontPhoto,
  sidePhoto,
}: {
  survey: SurveyDetail;
  frontPhoto?: string | null;
  sidePhoto?: string | null;
}) {
  const gps = survey.gps;
  const staticMapUrl = gps ? googleMapsStaticUrl(gps.latitude, gps.longitude, 640, 360) : null;
  const embedUrl = gps ? googleMapsEmbedUrl(gps.latitude, gps.longitude) : null;

  return (
    <section className="dn-section demand-notice-gallery rounded-md border border-slate-200 bg-white p-4 print:p-2">
      <SectionLabel>
        <BilingualLabel en="Site Imagery & GIS Mapping" hi="स्थल चित्र एवं जीआईएस मानचित्रण" />
      </SectionLabel>
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 print:gap-2">
        <div className="rounded-lg border border-slate-100 bg-[#f9f9fa] p-4 print:p-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Site Imagery</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GalleryPhoto url={frontPhoto} label="Front View / सामने का दृश्य" />
            <GalleryPhoto url={sidePhoto} label="Side View / बगल का दृश्य" />
          </div>
        </div>

        <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900 text-slate-100 print:rounded-none print:border-black">
          <div className="demand-notice-print-hide border-b border-slate-700 px-3 py-2 text-center text-xs font-semibold">
            <BilingualLabel en="GIS Map View" hi="जीआईएस मानचित्र दृश्य" />
          </div>
          {gps ? (
            <>
              <div className="relative aspect-video overflow-hidden bg-slate-800 print:aspect-auto">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
                {embedUrl && (
                  <iframe
                    title={`GIS Map — ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`}
                    src={embedUrl}
                    className="absolute inset-0 h-full w-full border-0 opacity-95 print:hidden"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-popups allow-forms"
                  />
                )}
                {staticMapUrl ? (
                  <div className="absolute inset-0 opacity-65">
                    <Image
                      src={staticMapUrl}
                      alt={`GIS Map — ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`}
                      fill
                      unoptimized
                      sizes="640px"
                      className="hidden h-full w-full object-cover print:block"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-700" />
                )}
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-emerald-300 bg-emerald-400/20 px-2 py-1 backdrop-blur-sm">
                  <MapPin className="h-4 w-4 text-emerald-200" aria-hidden />
                  <span className="font-mono text-xs font-semibold text-emerald-100">Parcel Marker</span>
                </div>
              </div>
              <figcaption className="border-t border-slate-700 px-3 py-2 text-xs">
                <p className="font-semibold uppercase tracking-wide text-slate-300">Latitude / Longitude</p>
                <p className="font-mono text-[12px] text-emerald-200">
                  {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
                </p>
              </figcaption>
            </>
          ) : (
            <div className="demand-notice-photo-frame flex aspect-video flex-col items-center justify-center gap-2 text-slate-300 print:aspect-auto">
              <MapPin className="h-7 w-7 opacity-40" aria-hidden />
              <p className="text-xs font-medium opacity-60">No GPS data</p>
            </div>
          )}
        </figure>
      </div>
    </section>
  );
}
