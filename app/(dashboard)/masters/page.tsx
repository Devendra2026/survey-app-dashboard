"use client";

import { MasterFormDialog, type MasterEditRow } from "@/components/masters/master-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteMaster, useMasterCategory, useUpsertMaster } from "@/hooks/masters/useMasterAdmin";
import { MASTER_CATEGORIES, MASTER_CATEGORY_LABELS, type MasterCategory } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MastersPage() {
  const [category, setCategory] = useState<MasterCategory>("assessment_year");
  const rows = useMasterCategory(category);
  const upsert = useUpsertMaster();
  const del = useDeleteMaster();
  const [editing, setEditing] = useState<MasterEditRow | null>(null);

  async function save() {
    if (!editing) return;
    try {
      await upsert({
        category,
        value: editing.value.trim(),
        label: editing.label.trim(),
        position: editing.position,
        isActive: editing.isActive,
      });
      toast.success("Master saved");
      setEditing(null);
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }
  async function toggle(r: any) {
    try {
      await upsert({ category, value: r.value, label: r.label, position: r.position, isActive: !r.isActive });
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }
  async function remove(r: any) {
    if (!confirm(`Delete "${r.label}"?`)) return;
    try {
      await del({ id: r._id });
      toast.success("Deleted");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  return (
    <RoleGate mode="page" capability="masters.manage" deniedDescription="Master data management is admin-only.">
      <div className="space-y-5">
        <PageHeader
          title="Master Data"
          description="Dropdown reference data shared with the mobile app via masters.bundle."
          actions={
            <Button
              onClick={() => setEditing({ value: "", label: "", position: (rows?.length ?? 0) + 1, isActive: true })}
            >
              <Plus className="h-4 w-4" /> Add option
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as MasterCategory)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MASTER_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {MASTER_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Note: edits here are not currently captured in the audit log (the existing upsert/delete don&apos;t write
            audit rows).
          </p>
        </div>

        <Card>
          <CardContent className="pt-5">
            {rows === undefined ? (
              <TableSkeleton rows={5} />
            ) : rows.length === 0 ? (
              <EmptyState title="No options yet" description="Add the first option for this category." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pos</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r._id ?? r.value}>
                      <TableCell className="tabular-nums text-muted-foreground">{r.position}</TableCell>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.value}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={r.isActive} onCheckedChange={() => toggle(r)} />
                          <Badge variant={r.isActive ? "default" : "secondary"}>
                            {r.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing({ ...r })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={!r._id}
                            onClick={() => remove(r)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <MasterFormDialog row={editing} onChange={setEditing} onSave={save} onClose={() => setEditing(null)} />
      </div>
    </RoleGate>
  );
}
