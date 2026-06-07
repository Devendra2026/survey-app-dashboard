"use client";

import { PropertyIdTableCell, PropertyIdTableHead } from "@/components/surveys/property-id-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAreaSqft } from "@/lib/survey/area";
import type { FloorRow } from "@/schema/surveys/index";
import { Trash2 } from "lucide-react";

export type FloorDraft = {
  clientFloorId: string;
  position: number;
  floorName: string;
  usageFactor?: string;
  usageType: string;
  constructionType: string;
  areaSqft: number;
};

export function FloorTable({
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

export function FloorDraftDialog({
  draft,
  opts,
  onClose,
  onChange,
  onSave,
}: {
  draft: FloorDraft | null;
  opts: {
    floors: { value: string; label: string }[];
    usageFactors: { value: string; label: string }[];
    usageTypes: { value: string; label: string }[];
    construction: { value: string; label: string }[];
  };
  onClose: () => void;
  onChange: (draft: FloorDraft) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{draft?.floorName === "open_land" ? "Open land row" : "Floor details"}</DialogTitle>
        </DialogHeader>
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Floor">
              <Sel
                value={draft.floorName}
                onChange={(v) => onChange({ ...draft, floorName: v })}
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
                onChange={(v) => onChange({ ...draft, usageFactor: v })}
                options={opts.usageFactors}
                placeholder="Select"
              />
            </Field>
            <Field label="Usage type">
              <Sel
                value={draft.usageType}
                onChange={(v) => onChange({ ...draft, usageType: v })}
                options={opts.usageTypes}
                placeholder="Select"
              />
            </Field>
            <Field label="Construction type">
              <Sel
                value={draft.constructionType}
                onChange={(v) => onChange({ ...draft, constructionType: v })}
                options={opts.construction}
                placeholder="Select"
              />
            </Field>
            <Field label="Area (sqft)">
              <Input
                type="number"
                value={draft.areaSqft}
                onChange={(e) => onChange({ ...draft, areaSqft: Number(e.target.value) })}
              />
            </Field>
            <Field label="Position">
              <Input
                type="number"
                value={draft.position}
                onChange={(e) => onChange({ ...draft, position: Number(e.target.value) })}
              />
            </Field>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!draft?.floorName || !draft?.usageType || !draft?.constructionType}>
            Save floor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
