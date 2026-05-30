"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePhotos, useRemovePhotoSlot, useUploadPhoto } from "@/hooks/surveys/usePhotos";
import { PHOTO_SLOTS, PHOTO_SLOT_LABEL, type PhotoSlot } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import type { PhotoRow } from "@/schema/surveys/index";
import { ImageOff, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/** front + side are required at submit (see surveys.submit). */
const REQUIRED: PhotoSlot[] = ["front", "side"];

export function PhotoUploader({ surveyId }: { surveyId: string }) {
  const photos = usePhotos(surveyId) as PhotoRow[] | undefined;
  const upload = useUploadPhoto();
  const removeSlot = useRemovePhotoSlot();
  const [busySlot, setBusySlot] = useState<PhotoSlot | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function onPick(slot: PhotoSlot, file?: File) {
    if (!file) return;
    setBusySlot(slot);
    try {
      await upload(surveyId, slot, file);
      toast.success(`${PHOTO_SLOT_LABEL[slot]} photo uploaded`);
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {PHOTO_SLOTS.map((slot) => {
        const photo = photos?.find((p) => p.slot === slot);
        const required = REQUIRED.includes(slot);
        return (
          <div key={slot} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{PHOTO_SLOT_LABEL[slot]}</span>
              {required && <Badge variant={photo ? "default" : "outline"}>{photo ? "OK" : "Required"}</Badge>}
            </div>
            <div className="relative mb-2 aspect-4/3 w-full overflow-hidden rounded-md bg-muted">
              {photo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt={slot} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-5 w-5" />
                </div>
              )}
              {busySlot === slot && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={(el) => {
                inputs.current[slot] = el;
              }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPick(slot, e.target.files?.[0])}
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={busySlot === slot}
                onClick={() => inputs.current[slot]?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> {photo ? "Replace" : "Upload"}
              </Button>
              {photo && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={busySlot === slot}
                  onClick={async () => {
                    try {
                      await removeSlot({ surveyId: surveyId as any, slot });
                    } catch (e) {
                      toast.error(parseConvexError(e).message);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
