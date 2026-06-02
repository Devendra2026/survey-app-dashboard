"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { PropertyIdTableCell, PropertyIdTableHead } from "@/components/surveys/property-id-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/lib/survey/area";
import type { FloorRow } from "@/schema/surveys/index";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
    <div className="rounded-lg border border-border">
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
}: {
  surveyId: string;
  plotSqft?: number;
  plinthSqft?: number;
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

  const builtUpFloors = useMemo(() => (floors ?? []).filter((f) => !isOpenLandFloor(f.floorName)), [floors]);
  const openLandFloors = useMemo(() => (floors ?? []).filter((f) => isOpenLandFloor(f.floorName)), [floors]);
  const builtUpTotal = builtUpSqftFromFloors(floors ?? []);
  const openLandTotal = openLandSqftFromFloors(floors ?? []);
  const plinthFromFloors = plinthSqftFromFloors(floors ?? []);

  const opts = {
    floors: masters?.floors ?? [],
    usageFactors: masters?.usageFactors ?? [],
    usageTypes: masters?.usageTypes ?? [],
    construction: masters?.constructionTypes ?? [],
  };

  async function savePlot() {
    if (!survey) return;
    setSavingPlot(true);
    try {
      await saveDraft({
        localId: survey.localId,
        municipalityId: survey.municipalityId,
        clientUpdatedAt: Date.now(),
        plotSqft,
        plinthSqft: plinthFromFloors || initialPlinth || survey.plinthSqft,
      } as any);
      toast.success("Plot area saved");
    } catch (e) {
      toast.error(parseConvexError(e).message);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plot area</CardTitle>
          <CardDescription>Total plot size on ground (sq ft).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 min-w-40">
            <Label>Plot (sqft)</Label>
            <Input type="number" value={plotSqft || ""} onChange={(e) => setPlotSqft(Number(e.target.value))} />
          </div>
          <Button size="sm" disabled={savingPlot} onClick={savePlot}>
            {savingPlot ? "Saving…" : "Save plot area"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Plinth area</CardTitle>
          <CardDescription>Calculated from ground floor row.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{formatAreaSqft(plinthFromFloors)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Built-up floors</CardTitle>
            <CardDescription>Ground floor, first floor, and other constructed levels.</CardDescription>
          </div>
          <Button size="sm" onClick={() => openAddFloor(false)}>
            <Plus className="h-4 w-4" /> Add floor
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {floors === undefined ? null : builtUpFloors.length === 0 ? (
            <EmptyState title="No built-up floors" description="Add ground floor or upper floors with their areas." />
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
          <div className="rounded-md border border-primary/25 bg-primary/5 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total built-up area</p>
            <p className="text-xl font-semibold tabular-nums">{formatAreaSqft(builtUpTotal)}</p>
            <p className="text-xs text-muted-foreground">Sum of all floor rows except open land.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Open land area</CardTitle>
            <CardDescription>Vacant or undeveloped plot area — separate from built-up floors.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => openAddFloor(true)}>
            <Plus className="h-4 w-4" /> Add open land
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total open land area</p>
            <p className="text-xl font-semibold tabular-nums">{formatAreaSqft(openLandTotal)}</p>
          </div>
        </CardContent>
      </Card>

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
