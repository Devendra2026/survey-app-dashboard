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
  const { masters } = useMasters({ includeTenantCatalog: false });
  const [draft, setDraft] = useState<FloorDraft | null>(null);
  const [savingPlot, setSavingPlot] = useState(false);
  /** Local edits only — server value comes from `initialPlot` (parent remounts via `key={surveyId}`). */
  const [plotOverride, setPlotOverride] = useState<number | null>(null);
  const plotDraft = plotOverride ?? initialPlot ?? 0;

  const builtUpFloors = useMemo(() => (floors ?? []).filter((f) => !isOpenLandFloor(f.floorName)), [floors]);
  const openLandFloors = useMemo(() => (floors ?? []).filter((f) => isOpenLandFloor(f.floorName)), [floors]);
  const builtUpTotal = builtUpSqftFromFloors(floors ?? []);
  const openLandTotal = openLandSqftFromFloors(floors ?? []);
  const plinthFromFloors = plinthSqftFromFloors(floors ?? []);

  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  const surveyRef = useRef(survey);
  surveyRef.current = survey;
  const plotSqftRef = useRef(plotDraft);
  plotSqftRef.current = plotDraft;
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
      const ok = await persistPlotArea(plotDraft);
      if (ok) {
        setPlotOverride(null);
        toast.success("Plot area saved");
      }
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
    if (!confirm("Remove this floor row?")) return;
    try {
      await remove({ id: id as any });
      toast.success("Floor removed");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  const floorMasters = {
    floors: masters?.floors,
    usageFactors: masters?.usageFactors,
    usageTypes: masters?.usageTypes,
    constructionTypes: masters?.constructionTypes,
  };

  return (
    <div className="space-y-4">
      <GlassCard padding="md">
        <GlassCardHeader title="Plot area" description="Total plot size on ground (sq ft)." />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 space-y-1.5">
            <Label>Plot (sqft)</Label>
            <Input
              type="number"
              value={plotDraft || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setPlotOverride(value);
                onPlotSqftChange?.(value);
              }}
            />
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
              title={openLandFloors.length > 0 ? "No built-up floors" : "Built-up floor required"}
              description={
                openLandFloors.length > 0
                  ? "Vacant plots can submit with open land only. Add floors here if the property has construction."
                  : "Add at least one floor row — built-up floors or open land — with area greater than 0."
              }
            />
          ) : (
            <FloorTable
              floors={builtUpFloors}
              masters={floorMasters}
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
              masters={floorMasters}
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
