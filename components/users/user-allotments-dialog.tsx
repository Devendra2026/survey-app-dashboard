"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Id } from "@/convex/_generated/dataModel";
import { useSetUserAllotments, useUserAllotments } from "@/hooks/rbac/useRbac";
import { useTenantCatalog } from "@/hooks/users/useUsers";
import { parseConvexError } from "@/lib/errors";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type DraftRow = {
  id: string;
  scope: "ulb" | "district";
  districtId: Id<"districts"> | "";
  municipalityId: Id<"municipalities"> | "";
  isActive: boolean;
};

type AllotmentUser = {
  _id: Id<"users">;
  name: string;
  role: string;
};

type AllotmentPayload = {
  isActive: boolean;
  districtId?: Id<"districts">;
  municipalityId?: Id<"municipalities">;
};

type ExistingAllotment = {
  _id: Id<"userAllotments">;
  districtId?: Id<"districts">;
  municipalityId?: Id<"municipalities">;
  isActive: boolean;
};

type TenantCatalog = NonNullable<ReturnType<typeof useTenantCatalog>>;

function mapAllotmentsToDraftRows(existing: ExistingAllotment[]): DraftRow[] {
  return existing.map((a) => ({
    id: a._id,
    scope: a.municipalityId ? ("ulb" as const) : ("district" as const),
    districtId: a.districtId ?? ("" as const),
    municipalityId: a.municipalityId ?? ("" as const),
    isActive: a.isActive,
  }));
}

function buildAllotmentPayload(rows: DraftRow[]): AllotmentPayload[] {
  const payload: AllotmentPayload[] = [];
  for (const r of rows) {
    if (r.scope === "ulb") {
      if (r.municipalityId) payload.push({ isActive: r.isActive, municipalityId: r.municipalityId });
    } else if (r.districtId) {
      payload.push({ isActive: r.isActive, districtId: r.districtId });
    }
  }
  return payload;
}

function UserAllotmentsForm({
  user,
  initialRows,
  catalog,
  onOpenChange,
}: {
  user: AllotmentUser;
  initialRows: DraftRow[];
  catalog: TenantCatalog | undefined;
  onOpenChange: (o: boolean) => void;
}) {
  const setAllotments = useSetUserAllotments();
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState(false);

  function addRow() {
    const firstDistrict = catalog?.[0]?._id ?? ("" as const);
    setRows((r) => [
      ...r,
      {
        id: `new-${Date.now()}`,
        scope: "ulb" as const,
        districtId: firstDistrict,
        municipalityId: "" as const,
        isActive: true,
      },
    ]);
  }

  async function save() {
    setBusy(true);
    try {
      await setAllotments({ userId: user._id, allotments: buildAllotmentPayload(rows) });
      toast.success("Allotments saved — effective on mobile immediately");
      onOpenChange(false);
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((row, idx) => {
          const district = catalog?.find((d) => d._id === row.districtId);
          const ulbs = district?.ulbs ?? [];
          return (
            <div key={row.id} className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
              <div className="space-y-1">
                <Label className="text-xs">Scope</Label>
                <Select
                  value={row.scope}
                  onValueChange={(v: "ulb" | "district") =>
                    setRows((all) =>
                      all.map((r, i) => (i === idx ? { ...r, scope: v, municipalityId: "" as const } : r)),
                    )
                  }
                >
                  <SelectTrigger className="h-8 w-35">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ulb">ULB (city)</SelectItem>
                    <SelectItem value="district">Whole district</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-35 flex-1 space-y-1">
                <Label className="text-xs">District</Label>
                <Select
                  value={row.districtId}
                  onValueChange={(v) =>
                    setRows((all) =>
                      all.map((r, i) =>
                        i === idx ? { ...r, districtId: v as Id<"districts">, municipalityId: "" as const } : r,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog?.map((d) => (
                      <SelectItem key={d._id} value={d._id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {row.scope === "ulb" ? (
                <div className="min-w-45 flex-1 space-y-1">
                  <Label className="text-xs">Municipality</Label>
                  <Select
                    value={row.municipalityId}
                    onValueChange={(v) =>
                      setRows((all) =>
                        all.map((r, i) => (i === idx ? { ...r, municipalityId: v as Id<"municipalities"> } : r)),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ULB" />
                    </SelectTrigger>
                    <SelectContent>
                      {ulbs.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  checked={row.isActive}
                  onCheckedChange={(c) => setRows((all) => all.map((r, i) => (i === idx ? { ...r, isActive: c } : r)))}
                />
                <Badge variant={row.isActive ? "default" : "outline"}>{row.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRows((all) => all.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" /> Add allotment
        </Button>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={save} disabled={busy}>
          Save allotments
        </Button>
      </DialogFooter>
    </>
  );
}

export function UserAllotmentsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: AllotmentUser | null;
}) {
  const catalog = useTenantCatalog();
  const existing = useUserAllotments(open && user ? user._id : undefined);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Supervisor / surveyor allotments</DialogTitle>
          <DialogDescription>
            {user.name} · assign multiple districts or ULBs (e.g. Agra MC, Mathura district, Hathras MC). Inactive rows
            keep history but remove access.
          </DialogDescription>
        </DialogHeader>

        {existing === undefined ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading allotments…</p>
        ) : (
          <UserAllotmentsForm
            key={user._id}
            user={user}
            initialRows={mapAllotmentsToDraftRows(existing)}
            catalog={catalog}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
