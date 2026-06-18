"use client";

import { googleMapsEmbedUrl, googleMapsStaticUrl } from "@/lib/maps/google-maps";
import type { SurveyDetail } from "@/schema/surveys/index";
import { ImageOff, MapPin } from "lucide-react";
import Image from "next/image";
import { BilingualLabel } from "./bilingual-label";
import { SectionLabel } from "./section-label";

function GalleryPhoto({ url, label }: { url?: string | null; label: string }) {
  return (
    <figure className="demand-notice-photo-cell overflow-hidden rounded-lg border border-(--dn-border) bg-white print:rounded-none print:border-black">
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

function GisMapPanel({ survey, isPrint }: { survey: SurveyDetail; isPrint: boolean }) {
  const gps = survey.gps;
  const staticMapUrl = gps ? googleMapsStaticUrl(gps.latitude, gps.longitude, 640, 360) : null;
  const embedUrl = gps ? googleMapsEmbedUrl(gps.latitude, gps.longitude) : null;

  return (
    <figure className="demand-notice-gis-panel flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-900 text-slate-100 print:rounded-none print:border-black">
      <p className="demand-notice-print-subhead shrink-0 border-b border-slate-700 px-2 py-1 text-center text-[7px] font-bold uppercase tracking-wide text-slate-200 print:border-black print:text-slate-700">
        <BilingualLabel en="GIS Map View" hi="जीआईएस मानचित्र" />
      </p>
      {gps ? (
        <>
          <div className="demand-notice-gis-frame relative min-h-0 flex-1 overflow-hidden bg-slate-800 print:aspect-auto">
            {!isPrint && (
              <>
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
                {embedUrl ? (
                  <iframe
                    title={`GIS Map — ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`}
                    src={embedUrl}
                    className="absolute inset-0 h-full w-full border-0 opacity-95"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-popups allow-forms"
                  />
                ) : null}
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded border border-emerald-300 bg-emerald-400/20 px-1.5 py-0.5">
                  <MapPin className="h-3 w-3 text-emerald-200" aria-hidden />
                  <span className="font-mono text-[8px] font-semibold text-emerald-100">Parcel</span>
                </div>
              </>
            )}
            {staticMapUrl ? (
              <Image
                src={staticMapUrl}
                alt={`GIS Map — ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`}
                fill
                unoptimized
                sizes="640px"
                className={isPrint ? "object-contain" : "hidden object-contain print:block"}
              />
            ) : isPrint ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-200 text-slate-600">
                <MapPin className="h-5 w-5 opacity-50" aria-hidden />
                <p className="text-[7px] font-medium">Map preview unavailable</p>
              </div>
            ) : null}
          </div>
          <figcaption className="shrink-0 border-t border-slate-700 px-2 py-1 text-[6px] print:border-black">
            <p className="font-semibold uppercase tracking-wide text-slate-300 print:text-slate-600">Lat / Long</p>
            <p className="font-mono text-[7px] text-emerald-200 print:text-slate-800">
              LAT: {gps.latitude.toFixed(6)} LONG: {gps.longitude.toFixed(6)}
            </p>
          </figcaption>
        </>
      ) : (
        <div className="demand-notice-gis-frame flex aspect-video flex-col items-center justify-center gap-2 text-slate-300 print:aspect-auto">
          <MapPin className="h-7 w-7 opacity-40 print:h-4 print:w-4" aria-hidden />
          <p className="text-xs font-medium opacity-60 print:text-[6px]">No GPS data</p>
        </div>
      )}
    </figure>
  );
}

export function NoticePhotoGallery({
  survey,
  frontPhoto,
  sidePhoto,
  variant = "screen",
}: {
  survey: SurveyDetail;
  frontPhoto?: string | null;
  sidePhoto?: string | null;
  variant?: "screen" | "print";
}) {
  const isPrint = variant === "print";

  return (
    <section
      className={`dn-section demand-notice-gallery rounded-md border border-slate-200 bg-white p-4 print:border-black print:p-1.5${isPrint ? " demand-notice-gallery-print" : ""}`}
    >
      <SectionLabel>
        <BilingualLabel en="Site Imagery & GIS Mapping" hi="स्थल चित्र एवं जीआईएस मानचित्रण" />
      </SectionLabel>
      <p className="demand-notice-print-section-label">
        <BilingualLabel en="Site Imagery & GIS Map" hi="स्थल चित्र एवं जीआईएस मानचित्र" />
      </p>

      <div
        className={
          isPrint
            ? "demand-notice-imagery-grid grid grid-cols-2 gap-2"
            : "grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2"
        }
      >
        <div className="demand-notice-site-photos rounded-lg border border-slate-100 bg-[#f9f9fa] p-4 print:rounded-none print:border-black print:bg-white print:p-1">
          <p className="demand-notice-print-subhead mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Site Imagery
          </p>
          <div className="grid grid-cols-2 gap-2">
            <GalleryPhoto url={frontPhoto} label="Front View / सामने का दृश्य" />
            <GalleryPhoto url={sidePhoto} label="Side View / बगल का दृश्य" />
          </div>
        </div>

        <GisMapPanel survey={survey} isPrint={isPrint} />
      </div>
    </section>
  );
}
