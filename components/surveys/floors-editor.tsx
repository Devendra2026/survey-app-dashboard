"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PropertyIdTableCell, PropertyIdTableHead } from "@/components/surveys/property-id-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Draft = {
  clientFloorId: string;
  position: number;
  floorName: string;
  usageFactor?: string;
  usageType: string;
  constructionType: string;
  areaSqft: number;
};

const newId = () => `flr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function FloorTable({
  floors,
  propertyId,
  onEdit,
  onRemove,
}: {
  floors: FloorRow[];
  propertyId?: string;
  onEdit: (f: FloorRow) => void;
  onRemove: (id: string) => void;
}) {
  if (floors.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No rows yet.</p>;
  }
  return (
    <div className="premium-card overflow-hidden rounded-xl border border-border/60 shadow-premium-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <PropertyIdTableHead />
            <TableHead>#</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Construction</TableHead>
            <TableHead>Area</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {floors.map((f) => (
            <TableRow key={f._id}>
              <PropertyIdTableCell propertyId={propertyId} />
              <TableCell>{f.position}</TableCell>
              <TableCell className="capitalize">{f.floorName.replace(/_/g, " ")}</TableCell>
              <TableCell className="capitalize">{f.usageType.replace(/_/g, " ")}</TableCell>
              <TableCell className="capitalize">{f.constructionType.replace(/_/g, " ")}</TableCell>
              <TableCell className="tabular-nums">{formatAreaSqft(f.areaSqft)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => onEdit(f)}>
                    Edit
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRemove(f._id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
  const [draft, setDraft] = useState<Draft | null>(null);
  const [plotSqft, setPlotSqft] = useState(initialPlot ?? 0);
  const [savingPlot, setSavingPlot] = useState(false);

  useEffect(() => {
    setPlotSqft(initialPlot ?? 0);
  }, [initialPlot]);

  useEffect(() => {
    onPlotSqftChange?.(plotSqft);
  }, [plotSqft, onPlotSqftChange]);

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

  useEffect(() => {
    if (!onRegisterSave) return;
    // react-doctor-disable-next-line react-doctor/no-pass-data-to-parent, react-doctor/no-prop-callback-in-effect -- parent registers area save on submit
    onRegisterSave(async () => persistPlotArea(plotSqftRef.current));
  }, [onRegisterSave]);

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

  async function persistPlotArea(plot: number): Promise<boolean> {
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
  }

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

  return (
    <div className="space-y-4">
      <GlassCard padding="md">
        <GlassCardHeader title="Plot area" description="Total plot size on ground (sq ft)." />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 space-y-1.5">
            <Label>Plot (sqft)</Label>
            <Input type="number" value={plotSqft || ""} onChange={(e) => setPlotSqft(Number(e.target.value))} />
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
              onRemove={async (id) => {
                try {
                  await remove({ id: id as any });
                } catch (e) {
                  toast.error(parseConvexError(e).message);
                }
              }}
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
              onRemove={async (id) => {
                try {
                  await remove({ id: id as any });
                } catch (e) {
                  toast.error(parseConvexError(e).message);
                }
              }}
            />
          )}
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Total open land area</p>
            <p className="font-mono text-xl font-bold tabular-nums">{formatAreaSqft(openLandTotal)}</p>
          </div>
        </div>
      </GlassCard>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.floorName === "open_land" ? "Open land row" : "Floor details"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Floor">
                <Sel
                  value={draft.floorName}
                  onChange={(v) => setDraft({ ...draft, floorName: v })}
                  options={
                    draft.floorName === "open_land"
                      ? opts.floors.filter((o) => o.value === "open_land")
                      : opts.floors.filter((o) => o.value !== "open_land")
                  }
                  placeholder="Select floor"
                  disabled={draft.floorName === "open_land"}
                />
              </Field>
              <Field label="Usage factor">
                <Sel
                  value={draft.usageFactor ?? ""}
                  onChange={(v) => setDraft({ ...draft, usageFactor: v })}
                  options={opts.usageFactors}
                  placeholder="Select"
                />
              </Field>
              <Field label="Usage type">
                <Sel
                  value={draft.usageType}
                  onChange={(v) => setDraft({ ...draft, usageType: v })}
                  options={opts.usageTypes}
                  placeholder="Select"
                />
              </Field>
              <Field label="Construction type">
                <Sel
                  value={draft.constructionType}
                  onChange={(v) => setDraft({ ...draft, constructionType: v })}
                  options={opts.construction}
                  placeholder="Select"
                />
              </Field>
              <Field label="Area (sqft)">
                <Input
                  type="number"
                  value={draft.areaSqft}
                  onChange={(e) => setDraft({ ...draft, areaSqft: Number(e.target.value) })}
                />
              </Field>
              <Field label="Position">
                <Input
                  type="number"
                  value={draft.position}
                  onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={saveFloor} disabled={!draft?.floorName || !draft?.usageType || !draft?.constructionType}>
              Save floor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Sel({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
