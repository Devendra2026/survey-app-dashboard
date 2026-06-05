"use client";

import { MasterFormDialog, type MasterEditRow } from "@/components/masters/master-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Id } from "@/convex/_generated/dataModel";
import { useDeleteMaster, useMasterCategory, useUpsertMaster } from "@/hooks/masters/useMasterAdmin";
import { useTenantAdmin, useUpsertDistrict, useUpsertMunicipality, useUpsertWard } from "@/hooks/tenants/useTenants";
import { MASTER_CATEGORIES, MASTER_CATEGORY_LABELS, type MasterCategory } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── tenant form types ────────────────────────────────────────────────────────

type DistrictDraft = {
  id?: Id<"districts">;
  code: string;
  name: string;
  stateName: string;
  isActive: boolean;
};

type MunicipalityDraft = {
  id?: Id<"municipalities">;
  districtId: Id<"districts">;
  code: string;
  name: string;
  bodyType: "municipal_council" | "town_panchayat";
  postalCode: string;
  isActive: boolean;
};

type WardDraft = {
  id?: Id<"wards">;
  municipalityId: Id<"municipalities">;
  wardNo: string;
  wardCode: string;
  name: string;
};

// ─── district dialog ──────────────────────────────────────────────────────────

function DistrictDialog({
  draft,
  onClose,
  onSave,
}: {
  draft: DistrictDraft | null;
  onClose: () => void;
  onSave: (d: DistrictDraft) => Promise<void>;
}) {
  const [form, setForm] = useState<DistrictDraft>(
    draft ?? { code: "", name: "", stateName: "Uttar Pradesh", isActive: true },
  );
  const [busy, setBusy] = useState(false);

  const canSave = form.code.trim().length >= 2 && form.name.trim().length > 0 && form.stateName.trim().length > 0;

  async function handleSave() {
    setBusy(true);
    try {
      await onSave({ ...form, code: form.code.trim().toUpperCase() });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit District" : "New District"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="d-code">Code</Label>
              <Input
                id="d-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="MTH"
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-state">State</Label>
              <Input
                id="d-state"
                value={form.stateName}
                onChange={(e) => setForm((f) => ({ ...f, stateName: e.target.value }))}
                placeholder="Uttar Pradesh"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-name">District name</Label>
            <Input
              id="d-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Mathura"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
            />
            <Label>{form.isActive ? "Active" : "Inactive"}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy || !canSave}>
            {busy ? "Saving…" : "Save district"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── municipality dialog ──────────────────────────────────────────────────────

function MunicipalityDialog({
  draft,
  onClose,
  onSave,
}: {
  draft: MunicipalityDraft | null;
  onClose: () => void;
  onSave: (d: MunicipalityDraft) => Promise<void>;
}) {
  const [form, setForm] = useState<MunicipalityDraft>(
    draft ?? {
      districtId: "" as Id<"districts">,
      code: "",
      name: "",
      bodyType: "municipal_council",
      postalCode: "",
      isActive: true,
    },
  );
  const [busy, setBusy] = useState(false);

  const canSave =
    form.code.trim().length >= 2 &&
    form.name.trim().length > 0 &&
    form.postalCode.trim().length === 6;

  async function handleSave() {
    setBusy(true);
    try {
      await onSave({ ...form, code: form.code.trim().toUpperCase() });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit ULB / Municipality" : "New ULB / Municipality"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-code">ULB code</Label>
              <Input
                id="m-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="MTH-MC-001"
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-pin">PIN code</Label>
              <Input
                id="m-pin"
                value={form.postalCode}
                maxLength={6}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value.replace(/\D/g, "") }))}
                placeholder="281001"
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Name</Label>
            <Input
              id="m-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Mathura Municipal Corporation"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Body type</Label>
            <Select
              value={form.bodyType}
              onValueChange={(v) => setForm((f) => ({ ...f, bodyType: v as MunicipalityDraft["bodyType"] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="municipal_council">Municipal Council / Corporation</SelectItem>
                <SelectItem value="town_panchayat">Town Panchayat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
            />
            <Label>{form.isActive ? "Active" : "Inactive"}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy || !canSave}>
            {busy ? "Saving…" : "Save ULB"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ward dialog ──────────────────────────────────────────────────────────────

function WardDialog({
  draft,
  onClose,
  onSave,
}: {
  draft: WardDraft | null;
  onClose: () => void;
  onSave: (d: WardDraft) => Promise<void>;
}) {
  const [form, setForm] = useState<WardDraft>(
    draft ?? { municipalityId: "" as Id<"municipalities">, wardNo: "", wardCode: "", name: "" },
  );
  const [busy, setBusy] = useState(false);
  const canSave = form.wardNo.trim().length > 0 && form.name.trim().length > 0;

  async function handleSave() {
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit Ward" : "New Ward"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="w-no">Ward number</Label>
              <Input
                id="w-no"
                value={form.wardNo}
                onChange={(e) => setForm((f) => ({ ...f, wardNo: e.target.value }))}
                placeholder="1"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-code">Ward code (optional)</Label>
              <Input
                id="w-code"
                value={form.wardCode}
                onChange={(e) => setForm((f) => ({ ...f, wardCode: e.target.value.toUpperCase() }))}
                placeholder="MTH-W01"
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-name">Ward name</Label>
            <Input
              id="w-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Krishna Nagar"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy || !canSave}>
            {busy ? "Saving…" : "Save ward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── tenants tab ──────────────────────────────────────────────────────────────

function TenantsTab() {
  const tenants = useTenantAdmin();
  const upsertDistrict = useUpsertDistrict();
  const upsertMunicipality = useUpsertMunicipality();
  const upsertWard = useUpsertWard();

  const [districtDraft, setDistrictDraft] = useState<DistrictDraft | null>(null);
  const [muniDraft, setMuniDraft] = useState<MunicipalityDraft | null>(null);
  const [wardDraft, setWardDraft] = useState<WardDraft | null>(null);
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());
  const [expandedUlbs, setExpandedUlbs] = useState<Set<string>>(new Set());

  function toggleDistrict(id: string) {
    setExpandedDistricts((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleUlb(id: string) {
    setExpandedUlbs((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function saveDistrict(d: DistrictDraft) {
    try {
      await upsertDistrict({
        id: d.id,
        code: d.code,
        name: d.name,
        stateName: d.stateName,
        isActive: d.isActive,
      });
      toast.success(d.id ? "District updated" : "District created");
      setDistrictDraft(null);
    } catch (e) {
      toast.error(parseConvexError(e).message);
      throw e;
    }
  }

  async function saveMunicipality(m: MunicipalityDraft) {
    try {
      await upsertMunicipality({
        id: m.id,
        districtId: m.districtId,
        code: m.code,
        name: m.name,
        bodyType: m.bodyType,
        postalCode: m.postalCode || undefined,
        isActive: m.isActive,
      });
      toast.success(m.id ? "ULB updated" : "ULB created");
      setMuniDraft(null);
    } catch (e) {
      toast.error(parseConvexError(e).message);
      throw e;
    }
  }

  async function saveWard(w: WardDraft) {
    try {
      await upsertWard({
        id: w.id,
        municipalityId: w.municipalityId,
        wardNo: w.wardNo,
        wardCode: w.wardCode || undefined,
        name: w.name,
      });
      toast.success(w.id ? "Ward updated" : "Ward created");
      setWardDraft(null);
    } catch (e) {
      toast.error(parseConvexError(e).message);
      throw e;
    }
  }

  if (tenants === undefined) return <TableSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tenants.length} district{tenants.length !== 1 ? "s" : ""} ·{" "}
          {tenants.reduce((acc, d) => acc + d.ulbs.length, 0)} ULBs ·{" "}
          {tenants.reduce((acc, d) => acc + d.ulbs.reduce((a, u) => a + u.wards.length, 0), 0)} wards
        </p>
        <Button
          size="sm"
          onClick={() =>
            setDistrictDraft({ code: "", name: "", stateName: "Uttar Pradesh", isActive: true })
          }
        >
          <Plus className="h-3.5 w-3.5" /> Add district
        </Button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          title="No districts yet"
          description="Add a district to start building your tenant hierarchy."
          icon={MapPin}
        />
      ) : (
        <div className="space-y-2">
          {tenants.map((district) => {
            const distOpen = expandedDistricts.has(district._id);
            return (
              <Card key={district._id} className="overflow-hidden">
                {/* district row */}
                <Collapsible open={distOpen} onOpenChange={() => toggleDistrict(district._id)}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                    >
                      {distOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <MapPin className="h-4 w-4 shrink-0 text-violet-500" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm">{district.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{district.code}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{district.stateName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="outline" className="text-xs">
                          {district.ulbs.length} ULB{district.ulbs.length !== 1 ? "s" : ""}
                        </Badge>
                        {!district.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            setDistrictDraft({
                              id: district._id as Id<"districts">,
                              code: district.code,
                              name: district.name,
                              stateName: district.stateName,
                              isActive: district.isActive,
                            })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          ULBs / Municipalities
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            setMuniDraft({
                              districtId: district._id as Id<"districts">,
                              code: "",
                              name: "",
                              bodyType: "municipal_council",
                              postalCode: "",
                              isActive: true,
                            })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" /> Add ULB
                        </Button>
                      </div>

                      {district.ulbs.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No ULBs yet for this district.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {district.ulbs.map((ulb) => {
                            const ulbOpen = expandedUlbs.has(ulb._id);
                            return (
                              <Card key={ulb._id} className="border-border">
                                <Collapsible open={ulbOpen} onOpenChange={() => toggleUlb(ulb._id)}>
                                  <CollapsibleTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors rounded-lg"
                                    >
                                      {ulbOpen ? (
                                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      )}
                                      <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                      <div className="min-w-0 flex-1">
                                        <span className="text-sm font-medium">{ulb.name}</span>
                                        <span className="ml-2 font-mono text-xs text-muted-foreground">{ulb.code}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <Badge variant="outline" className="text-[10px]">
                                          {ulb.bodyType === "municipal_council" ? "MC" : "TP"}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px]">
                                          {ulb.wards.length} ward{ulb.wards.length !== 1 ? "s" : ""}
                                        </Badge>
                                        {!ulb.isActive && (
                                          <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                                        )}
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6"
                                          onClick={() =>
                                            setMuniDraft({
                                              id: ulb._id as Id<"municipalities">,
                                              districtId: district._id as Id<"districts">,
                                              code: ulb.code,
                                              name: ulb.name,
                                              bodyType: ulb.bodyType as MunicipalityDraft["bodyType"],
                                              postalCode: ulb.postalCode ?? "",
                                              isActive: ulb.isActive,
                                            })
                                          }
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </button>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent>
                                    <div className="border-t border-border bg-background px-3 py-2.5 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Wards
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 text-[10px] px-2"
                                          onClick={() =>
                                            setWardDraft({
                                              municipalityId: ulb._id as Id<"municipalities">,
                                              wardNo: String(ulb.wards.length + 1),
                                              wardCode: "",
                                              name: "",
                                            })
                                          }
                                        >
                                          <Plus className="h-3 w-3" /> Add ward
                                        </Button>
                                      </div>
                                      {ulb.wards.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No wards yet.</p>
                                      ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                          {ulb.wards.map((ward) => (
                                            <button
                                              key={ward._id}
                                              type="button"
                                              className="group flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:border-primary/40 hover:bg-muted/40 transition-colors"
                                              onClick={() =>
                                                setWardDraft({
                                                  id: ward._id as Id<"wards">,
                                                  municipalityId: ulb._id as Id<"municipalities">,
                                                  wardNo: ward.wardNo,
                                                  wardCode: ward.wardCode ?? "",
                                                  name: ward.name,
                                                })
                                              }
                                            >
                                              <span className="font-medium">W{ward.wardNo}</span>
                                              <span className="text-muted-foreground">· {ward.name}</span>
                                              <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {districtDraft !== null && (
        <DistrictDialog draft={districtDraft} onClose={() => setDistrictDraft(null)} onSave={saveDistrict} />
      )}
      {muniDraft !== null && (
        <MunicipalityDialog draft={muniDraft} onClose={() => setMuniDraft(null)} onSave={saveMunicipality} />
      )}
      {wardDraft !== null && (
        <WardDialog draft={wardDraft} onClose={() => setWardDraft(null)} onSave={saveWard} />
      )}
    </div>
  );
}

// ─── master data tab ──────────────────────────────────────────────────────────

function MasterDataTab() {
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        </div>
        <Button
          size="sm"
          onClick={() => setEditing({ value: "", label: "", position: (rows?.length ?? 0) + 1, isActive: true })}
        >
          <Plus className="h-4 w-4" /> Add option
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: edits here are not currently captured in the audit log.
      </p>

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
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function MastersPage() {
  return (
    <RoleGate mode="page" capability="masters.manage" deniedDescription="Master data management is admin-only.">
      <div className="space-y-5">
        <PageHeader
          title="Master Data"
          description="Manage dropdown reference data and the geographic tenant hierarchy."
        />

        <Tabs defaultValue="masters">
          <TabsList>
            <TabsTrigger value="masters">
              <Database className="mr-1.5 h-3.5 w-3.5" /> Reference Data
            </TabsTrigger>
            <TabsTrigger value="tenants">
              <MapPin className="mr-1.5 h-3.5 w-3.5" /> Tenants & Wards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="masters" className="mt-4">
            <MasterDataTab />
          </TabsContent>

          <TabsContent value="tenants" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  Districts · ULBs · Wards
                  <span className="text-xs font-normal text-muted-foreground">
                    — geographic hierarchy for supervisor/surveyor assignment
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TenantsTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGate>
  );
}
