"use client";

import { googleMapsEmbedUrl, googleMapsStaticUrl } from "@/lib/maps/google-maps";
import type { SurveyDetail } from "@/schema/surveys/index";
import { ImageOff, MapPin } from "lucide-react";
import Image from "next/image";
import { BilingualLabel, SectionLabel } from "./shared";

function GalleryPhoto({ url, label }: { url?: string | null; label: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-[var(--dn-border)] bg-white print:rounded-none print:border-black">
      <div className="demand-notice-photo-frame relative aspect-[4/3] w-full bg-muted/20 sm:aspect-square print:aspect-auto">
        {url ? (
          <Image src={url} alt={label} fill unoptimized sizes="280px" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-8 w-8 opacity-40 print:h-4 print:w-4" aria-hidden />
            <p className="text-xs font-medium opacity-60 print:text-[6px]">No photo</p>
          </div>
        )}
      </div>
      <figcaption className="demand-notice-print-hide border-t border-[var(--dn-border)] px-3 py-2 text-center text-xs font-semibold text-[var(--dn-primary)]">
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
  const staticMapUrl = gps ? googleMapsStaticUrl(gps.latitude, gps.longitude, 280, 200) : null;
  const embedUrl = gps ? googleMapsEmbedUrl(gps.latitude, gps.longitude) : null;

  return (
    <section className="dn-section demand-notice-gallery">
      <SectionLabel>
        <BilingualLabel en="Property Images & Location" hi="संपत्ति का चित्र एवं स्थान" />
      </SectionLabel>
      <div className="grid grid-cols-1 gap-[var(--dn-space-3)] sm:grid-cols-3 print:grid-cols-3 print:gap-1">
        <GalleryPhoto url={frontPhoto} label="Front View / सामने का दृश्य" />
        <GalleryPhoto url={sidePhoto} label="Side View / बगल का दृश्य" />
        <figure className="overflow-hidden rounded-lg border border-[var(--dn-border)] bg-white print:rounded-none print:border-black">
          <div className="demand-notice-print-hide border-b border-[var(--dn-border)] px-3 py-2 text-center text-xs font-semibold text-[var(--dn-primary)]">
            <BilingualLabel en="GPS Location" hi="जीपीएस स्थान" />
          </div>
          {gps ? (
            <>
              <div className="demand-notice-photo-frame relative aspect-[4/3] w-full bg-muted/20 sm:aspect-square print:hidden">
                {embedUrl && (
                  <iframe
                    title={`GIS Map — ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`}
                    src={embedUrl}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
                  />
                )}
              </div>
              <div className="demand-notice-photo-frame relative hidden aspect-[4/3] w-full bg-muted/20 print:block print:aspect-auto">
                {staticMapUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={staticMapUrl}
                    alt={`GIS Map — ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted-foreground">
                    <MapPin className="h-5 w-5 opacity-40" aria-hidden />
                    <p className="font-mono text-[10px]">
                      {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
              <figcaption className="demand-notice-print-hide border-t border-[var(--dn-border)] px-2 py-1.5 text-center font-mono text-[10px] text-[var(--dn-secondary)]">
                {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
              </figcaption>
            </>
          ) : (
            <div className="demand-notice-photo-frame flex aspect-[4/3] flex-col items-center justify-center gap-2 text-muted-foreground print:aspect-auto">
              <MapPin className="h-7 w-7 opacity-40" aria-hidden />
              <p className="text-xs font-medium opacity-60">No GPS data</p>
            </div>
          )}
        </figure>
      </div>
    </section>
  );
}
