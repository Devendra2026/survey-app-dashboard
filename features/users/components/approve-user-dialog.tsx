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
import { useApproveUser, useTenantCatalog } from "@/features/users/hooks/useUsers";
import { parseConvexError } from "@/lib/errors";
import { useState } from "react";
import { toast } from "sonner";

export function ApproveUserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: { _id: string; name: string; email: string; requestedRole?: string } | null;
}) {
  const approve = useApproveUser();
  const catalog = useTenantCatalog();
  const [role, setRole] = useState<string>("surveyor");
  const [municipalityId, setMunicipalityId] = useState<string>("");
  const [wards, setWards] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const munis = catalog?.flatMap((d) => d.ulbs) ?? [];
  const wardsForMuni = munis.find((m) => m._id === municipalityId)?.wards ?? [];

  if (!user) return null;

  async function submit() {
    setBusy(true);
    try {
      await approve({
        userId: user!._id as any,
        role: role as any,
        municipalityId: role !== "admin" && municipalityId ? (municipalityId as any) : undefined,
        wardAssignments: wards,
      });
      toast.success(`${user!.name} approved as ${role}`);
      onOpenChange(false);
      setWards([]);
      setMunicipalityId("");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve user</DialogTitle>
          <DialogDescription>
            {user.name} · {user.email}
            {user.requestedRole && (
              <>
                {" "}
                · requested{" "}
                <Badge variant="outline" className="text-muted-foreground">
                  {user.requestedRole}
                </Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="surveyor">Surveyor</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role !== "admin" && (
            <>
              <div className="space-y-1.5">
                <Label>Municipality (ULB)</Label>
                <Select
                  value={municipalityId}
                  onValueChange={(v) => {
                    setMunicipalityId(v);
                    setWards([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a ULB" />
                  </SelectTrigger>
                  <SelectContent>
                    {munis.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name} ({m.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {municipalityId && wardsForMuni.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Ward assignments (optional)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {wardsForMuni.map((w) => {
                      const sel = wards.includes(w.wardNo);
                      return (
                        <button
                          key={w._id}
                          type="button"
                          onClick={() => setWards((c) => (sel ? c.filter((x) => x !== w.wardNo) : [...c, w.wardNo]))}
                          className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${sel ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                        >
                          Ward {w.wardNo}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Leave empty to allow all wards in the ULB.</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || (role !== "admin" && !municipalityId)}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
