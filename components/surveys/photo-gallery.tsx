"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PHOTO_SLOTS, PHOTO_SLOT_LABEL, type PhotoSlot } from "@/lib/domain";
import { fmtDate } from "@/lib/utils";
import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface Photo {
  _id: string;
  slot: PhotoSlot;
  url: string | null;
  capturedAt: number;
  sizeKb: number;
}

export function PhotoGallery({ photos, uploaderName }: { photos: Photo[]; uploaderName?: string }) {
  const [active, setActive] = useState<Photo | null>(null);

  return (
    <>
      <div className="space-y-6">
        {PHOTO_SLOTS.map((slot) => {
          const inSlot = photos.filter((p) => p.slot === slot);
          return (
            <div key={slot}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold">{PHOTO_SLOT_LABEL[slot]}</h3>
                <Badge variant="outline">{inSlot.length}</Badge>
              </div>
              {inSlot.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  <ImageOff className="h-4 w-4" /> No {PHOTO_SLOT_LABEL[slot].toLowerCase()} photo
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {inSlot.map((p) => (
                    <button
                      type="button"
                      key={p._id}
                      onClick={() => setActive(p)}
                      className="group overflow-hidden rounded-lg border border-border bg-muted text-left"
                    >
                      <div className="relative aspect-4/3 w-full bg-muted">
                        {p.url ? (
                          <Image
                            src={p.url}
                            alt={slot}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImageOff className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-[11px] text-muted-foreground">
                        <p>{fmtDate(p.capturedAt)}</p>
                        {uploaderName && <p className="truncate">by {uploaderName}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{active ? PHOTO_SLOT_LABEL[active.slot] : ""} photo</DialogTitle>
          {active?.url && (
            <Image
              src={active.url}
              alt={active.slot}
              width={1200}
              height={800}
              unoptimized
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
          {active && (
            <p className="text-xs text-muted-foreground">
              Captured {fmtDate(active.capturedAt)} · {active.sizeKb} KB
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
