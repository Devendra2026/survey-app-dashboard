"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMasters } from "@/hooks/masters/useMasters";
import { useFloors, useRemoveFloor, useUpsertFloor } from "@/hooks/surveys/useFloors";
import { parseConvexError } from "@/lib/errors";
import type { FloorRow } from "@/schema/surveys/index";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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

export function FloorsEditor({ surveyId }: { surveyId: string }) {
  const floors = useFloors(surveyId) as FloorRow[] | undefined;
  const upsert = useUpsertFloor();
  const remove = useRemoveFloor();
  const { masters } = useMasters();
  const [draft, setDraft] = useState<Draft | null>(null);

  const opts = {
    floors: masters?.floors ?? [],
    usageFactors: masters?.usageFactors ?? [],
    usageTypes: masters?.usageTypes ?? [],
    construction: masters?.constructionTypes ?? [],
  };

  async function save() {
    if (!draft) return;
    try {
      // isOccupied is derived server-side from usageType; send a sane default.
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Floors</h3>
        <Button
          size="sm"
          onClick={() =>
            setDraft({
              clientFloorId: newId(),
              position: (floors?.length ?? 0) + 1,
              floorName: "",
              usageType: "",
              constructionType: "",
              areaSqft: 0,
            })
          }
        >
          <Plus className="h-4 w-4" /> Add floor
        </Button>
      </div>

      {floors === undefined ? null : floors.length === 0 ? (
        <EmptyState title="No floors yet" description="Add at least one floor before submitting." />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell>{f.position}</TableCell>
                  <TableCell className="capitalize">{f.floorName.replace(/_/g, " ")}</TableCell>
                  <TableCell className="capitalize">{f.usageType.replace(/_/g, " ")}</TableCell>
                  <TableCell className="capitalize">{f.constructionType.replace(/_/g, " ")}</TableCell>
                  <TableCell className="tabular-nums">{f.areaSqft}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => setDraft({ ...f, usageFactor: f.usageFactor })}
                      >
                        Edit
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={async () => {
                          try {
                            await remove({ id: f._id });
                          } catch (e) {
                            toast.error(parseConvexError(e).message);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Floor details</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Floor">
                <Sel
                  value={draft.floorName}
                  onChange={(v) => setDraft({ ...draft, floorName: v })}
                  options={opts.floors}
                  placeholder="Select floor"
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
            <Button onClick={save} disabled={!draft?.floorName || !draft?.usageType || !draft?.constructionType}>
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
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
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
