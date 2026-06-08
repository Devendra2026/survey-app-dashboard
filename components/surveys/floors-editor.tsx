"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FloorDraftDialog, FloorTable, type FloorDraft } from "@/components/surveys/floors-editor-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMasters } from "@/hooks/masters/useMasters";
import { useFloors, useRemoveFloor, useUpsertFloor } from "@/hooks/surveys/useFloors";
import { useSaveDraft, useSurvey } from "@/hooks/surveys/useSurveys";
import { parseConvexError } from "@/lib/errors";
import {
  builtUpSqftFromFloors,
  formatAreaSqft,
  isOpenLandFloor,
  openLandSqftFromFloors,
  plinthSqftFromFloors,
  plotPlinthConflict,
} from "@/lib/survey/area";
import type { FloorRow } from "@/schema/surveys/index";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const newId = () => `flr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function FloorsEditor({
  surveyId,
  plotSqft: initialPlot,
  plinthSqft: initialPlinth,
  onRegisterSave,
  onPlotSqftChange,
}: {
  surveyId: string;
  plotSqft?: number;
  plinthSqft?: number;
  onRegisterSave?: (fn: () => Promise<boolean>) => void;
  onPlotSqftChange?: (plotSqft: number) => void;
}) {
  const floors = useFloors(surveyId) as FloorRow[] | undefined;
  const survey = useSurvey(surveyId);
  const upsert = useUpsertFloor();
  const remove = useRemoveFloor();
  const saveDraft = useSaveDraft();
  const { masters } = useMasters();
  const [draft, setDraft] = useState<FloorDraft | null>(null);
  const [savingPlot, setSavingPlot] = useState(false);
  const plotSqft = initialPlot ?? 0;

  const builtUpFloors = useMemo(() => (floors ?? []).filter((f) => !isOpenLandFloor(f.floorName)), [floors]);
  const openLandFloors = useMemo(() => (floors ?? []).filter((f) => isOpenLandFloor(f.floorName)), [floors]);
  const builtUpTotal = builtUpSqftFromFloors(floors ?? []);
  const openLandTotal = openLandSqftFromFloors(floors ?? []);
  const plinthFromFloors = plinthSqftFromFloors(floors ?? []);

  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  const surveyRef = useRef(survey);
  surveyRef.current = survey;
  const plotSqftRef = useRef(plotSqft);
  plotSqftRef.current = plotSqft;
  const plinthRef = useRef(plinthFromFloors);
  plinthRef.current = plinthFromFloors;
  const floorsRef = useRef(floors);
  floorsRef.current = floors;

  const opts = {
    floors: masters?.floors ?? [],
    usageFactors: masters?.usageFactors ?? [],
    usageTypes: masters?.usageTypes ?? [],
    construction: masters?.constructionTypes ?? [],
  };

  function resolvePlinthSqft(currentSurvey: NonNullable<typeof survey>): number {
    if (plinthRef.current > 0) return plinthRef.current;
    if ((floorsRef.current?.length ?? 0) > 0) return 0;
    return currentSurvey.plinthSqft || 0;
  }

  const persistPlotArea = useCallback(
    async (plot: number): Promise<boolean> => {
      const currentSurvey = surveyRef.current;
      if (!currentSurvey) return false;
      if (!(plot > 0)) {
        toast.error("Enter plot area greater than 0.");
        return false;
      }
      const plinth = resolvePlinthSqft(currentSurvey);
      const conflict = plotPlinthConflict(plot, plinth);
      if (conflict) {
        toast.error(conflict);
        return false;
      }
      try {
        await saveDraftRef.current({
          id: (surveyId ?? currentSurvey._id) as any,
          localId: currentSurvey.localId,
          municipalityId: currentSurvey.municipalityId,
          clientUpdatedAt: Date.now(),
          plotSqft: plot,
          plinthSqft: plinth,
        } as any);
        return true;
      } catch (e) {
        toast.error(parseConvexError(e).message);
        return false;
      }
    },
    [surveyId],
  );

  useEffect(() => {
    if (!onRegisterSave) return;
    // react-doctor-disable-next-line react-doctor/no-pass-data-to-parent, react-doctor/no-prop-callback-in-effect, react-doctor/no-pass-live-state-to-parent -- parent registers area save on submit
    onRegisterSave(async () => persistPlotArea(plotSqftRef.current));
  }, [onRegisterSave, persistPlotArea]);

  async function savePlot() {
    if (!survey) return;
    setSavingPlot(true);
    try {
      const ok = await persistPlotArea(plotSqft);
      if (ok) toast.success("Plot area saved");
    } finally {
      setSavingPlot(false);
    }
  }

  async function saveFloor() {
    if (!draft) return;
    try {
      await upsert({
        surveyId: surveyId as any,
        clientFloorId: draft.clientFloorId,
        position: draft.position,
        floorName: draft.floorName,
        usageFactor: draft.usageFactor || undefined,
        usageType: draft.usageType,
        constructionType: draft.constructionType,
        isOccupied: draft.usageType === "self_occupied" || draft.usageType === "rented",
        areaSqft: draft.areaSqft,
      });
      toast.success("Floor saved");
      setDraft(null);
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  function openAddFloor(isOpenLand: boolean) {
    setDraft({
      clientFloorId: newId(),
      position: (floors?.length ?? 0) + 1,
      floorName: isOpenLand ? "open_land" : "",
      usageType: "",
      constructionType: isOpenLand ? "open_land_plot" : "",
      areaSqft: 0,
    });
  }

  async function handleRemoveFloor(id: string) {
    try {
      await remove({ id: id as any });
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard padding="md">
        <GlassCardHeader title="Plot area" description="Total plot size on ground (sq ft)." />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 space-y-1.5">
            <Label>Plot (sqft)</Label>
            <Input type="number" value={plotSqft || ""} onChange={(e) => onPlotSqftChange?.(Number(e.target.value))} />
          </div>
          <Button size="sm" disabled={savingPlot} onClick={savePlot} className="cursor-pointer rounded-xl">
            {savingPlot ? "Saving…" : "Save plot area"}
          </Button>
        </div>
      </GlassCard>

      <GlassCard padding="md" variant="accent">
        <GlassCardHeader title="Plinth area" description="Calculated from ground floor row." />
        <p className="font-display text-2xl font-bold tabular-nums text-brand-navy dark:text-primary-foreground">
          {formatAreaSqft(plinthFromFloors)}
        </p>
      </GlassCard>

      <GlassCard padding="md">
        <GlassCardHeader
          title="Built-up floors"
          description="Ground floor, first floor, and other constructed levels."
          action={
            <Button size="sm" onClick={() => openAddFloor(false)} className="cursor-pointer rounded-xl">
              <Plus className="h-4 w-4" aria-hidden /> Add floor
            </Button>
          }
        />
        <div className="space-y-3">
          {floors === undefined ? null : builtUpFloors.length === 0 ? (
            <EmptyState
              title="Built-up floor required"
              description={
                openLandFloors.length > 0
                  ? "Open land alone is not enough for QC submit — add a ground floor or upper floor with its area."
                  : "Add ground floor or upper floors with their areas before submitting."
              }
            />
          ) : (
            <FloorTable
              floors={builtUpFloors}
              propertyId={survey?.propertyId}
              onEdit={(f) => setDraft({ ...f, usageFactor: f.usageFactor })}
              onRemove={handleRemoveFloor}
            />
          )}
          <div className="rounded-xl border border-brand-navy/15 bg-brand-navy/5 px-4 py-3 dark:border-primary/20 dark:bg-primary/10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Total built-up area</p>
            <p className="font-mono text-xl font-bold tabular-nums text-brand-navy dark:text-primary-foreground">
              {formatAreaSqft(builtUpTotal)}
            </p>
            <p className="text-xs text-muted-foreground">Sum of all floor rows except open land.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard padding="md">
        <GlassCardHeader
          title="Open land area"
          description="Vacant or undeveloped plot area — separate from built-up floors."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => openAddFloor(true)}
              className="cursor-pointer rounded-xl"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add open land
            </Button>
          }
        />
        <div className="space-y-3">
          {floors === undefined ? null : openLandFloors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open land rows. Add one if part of the plot is vacant.</p>
          ) : (
            <FloorTable
              floors={openLandFloors}
              propertyId={survey?.propertyId}
              onEdit={(f) => setDraft({ ...f, usageFactor: f.usageFactor })}
              onRemove={handleRemoveFloor}
            />
          )}
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Total open land area</p>
            <p className="font-mono text-xl font-bold tabular-nums">{formatAreaSqft(openLandTotal)}</p>
          </div>
        </div>
      </GlassCard>

      <FloorDraftDialog
        draft={draft}
        opts={opts}
        onClose={() => setDraft(null)}
        onChange={setDraft}
        onSave={saveFloor}
      />
    </div>
  );
}
