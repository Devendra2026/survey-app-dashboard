"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Id } from "@/convex/_generated/dataModel";
import { useRoles } from "@/hooks/rbac/useRbac";
import {
  useApproveUser,
  useAssignTenant,
  useRejectUser,
  useTenantCatalog,
  useUpdateUser,
} from "@/hooks/users/useUsers";
import { parseConvexError } from "@/lib/errors";
import { cn, fmtDate } from "@/lib/utils";
import { Ban, Building2, CheckCircle2, Clock, MessageSquare, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── shared color maps ────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

const ROLE_COLORS: Record<string, string> = {
  admin:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30",
  supervisor:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  surveyor:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  pending:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  disabled: "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
  pending_approval:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
};

function avatarColor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── exported types ───────────────────────────────────────────────────────────

export type SheetPendingUser = {
  kind: "pending";
  _id: Id<"users">;
  name: string;
  email: string;
  requestedRole?: string;
  requestedReason?: string;
  createdAt: number;
};

export type SheetListedUser = {
  kind: "listed";
  _id: Id<"users">;
  name: string;
  email: string;
  role: string;
  status: string;
  municipalityId?: Id<"municipalities"> | null;
  municipalityName?: string | null;
  wardAssignments?: string[] | null;
  createdAt: number;
};

export type SheetUser = SheetPendingUser | SheetListedUser;

// ─── ward chip picker ─────────────────────────────────────────────────────────

function WardPicker({
  wards,
  selected,
  onChange,
}: {
  wards: { _id: string; wardNo: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  if (wards.length === 0) return null;

  function toggle(wardNo: string) {
    onChange(selected.includes(wardNo) ? selected.filter((x) => x !== wardNo) : [...selected, wardNo]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Ward assignments</Label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {wards.map((w) => {
          const on = selected.includes(w.wardNo);
          return (
            <button
              key={w._id}
              type="button"
              onClick={() => toggle(w.wardNo)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                on
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              Ward {w.wardNo}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {selected.length === 0
          ? "Leave empty to allow all wards in the ULB."
          : `${selected.length} ward${selected.length !== 1 ? "s" : ""} assigned.`}
      </p>
    </div>
  );
}

// ─── section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

// ─── approve pending panel ────────────────────────────────────────────────────

function ApprovePendingPanel({ user, onClose }: { user: SheetPendingUser; onClose: () => void }) {
  const approve = useApproveUser();
  const reject = useRejectUser();
  const roleCatalog = useRoles({ requireCapability: "users.approve" });
  const catalog = useTenantCatalog();

  const [role, setRole] = useState<string>(user.requestedRole ?? "surveyor");
  const [municipalityId, setMunicipalityId] = useState<string>("");
  const [wards, setWards] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const munis = catalog?.flatMap((d) => d.ulbs) ?? [];
  const wardsForMuni = munis.find((m) => m._id === municipalityId)?.wards ?? [];
  const activeRoles = (roleCatalog ?? []).filter((r) => r.isActive && r.key !== "pending");
  const needsMuni = role !== "admin";
  const canApprove = !needsMuni || !!municipalityId;

  async function onApprove() {
    setBusy(true);
    try {
      await approve({
        userId: user._id,
        role: role as never,
        municipalityId: needsMuni && municipalityId ? (municipalityId as Id<"municipalities">) : undefined,
        wardAssignments: wards,
      });
      toast.success(`${user.name} approved as ${role}`);
      onClose();
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    if (!confirm(`Reject ${user.name}? Their account will be disabled.`)) return;
    setBusy(true);
    try {
      await reject({ userId: user._id });
      toast.success("User rejected");
      onClose();
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-5 py-4">
          {/* request context */}
          {(user.requestedRole || user.requestedReason) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                <MessageSquare className="h-3.5 w-3.5" /> Sign-up request
              </p>
              {user.requestedRole && (
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Requested:</span>
                  <Badge variant="outline" className={ROLE_COLORS[user.requestedRole] ?? ""}>
                    {user.requestedRole}
                  </Badge>
                </div>
              )}
              {user.requestedReason && (
                <p className="text-sm text-foreground/80 italic">&ldquo;{user.requestedReason}&rdquo;</p>
              )}
            </div>
          )}

          {/* role selector */}
          <div className="space-y-2">
            <SectionLabel>Assign role</SectionLabel>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                setMunicipalityId("");
                setWards([]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeRoles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* municipality — skipped for admin */}
          {needsMuni && (
            <>
              <Separator />
              <div className="space-y-2">
                <SectionLabel>Assign municipality</SectionLabel>
                <Select
                  value={municipalityId}
                  onValueChange={(v) => {
                    setMunicipalityId(v);
                    setWards([]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a ULB…" />
                  </SelectTrigger>
                  <SelectContent>
                    {munis.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {m.name}
                          <span className="text-xs text-muted-foreground">({m.code})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {municipalityId && wardsForMuni.length > 0 && (
                <WardPicker wards={wardsForMuni} selected={wards} onChange={setWards} />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <Separator />
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={onReject}
          disabled={busy}
        >
          <UserX className="h-4 w-4" /> Reject
        </Button>
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={onApprove}
          disabled={busy || !canApprove}
        >
          <UserCheck className="h-4 w-4" />
          {busy ? "Approving…" : "Approve"}
        </Button>
      </div>
    </>
  );
}

// ─── edit listed user panel ───────────────────────────────────────────────────

function EditListedPanel({ user, onClose }: { user: SheetListedUser; onClose: () => void }) {
  const updateUserMut = useUpdateUser();
  const assignTenantMut = useAssignTenant();
  const roleCatalog = useRoles({ requireCapability: "users.approve" });
  const catalog = useTenantCatalog();

  const [role, setRole] = useState(user.role);
  const [municipalityId, setMunicipalityId] = useState<string>(
    user.role !== "admin" ? (user.municipalityId ?? "") : "",
  );
  const [wards, setWards] = useState<string[]>(user.role !== "admin" ? (user.wardAssignments ?? []) : []);
  const [busy, setBusy] = useState(false);

  const munis = catalog?.flatMap((d) => d.ulbs) ?? [];
  const wardsForMuni = munis.find((m) => m._id === municipalityId)?.wards ?? [];
  const activeRoles = (roleCatalog ?? []).filter((r) => r.isActive && r.key !== "pending");
  const isAdmin = role === "admin";

  const roleChanged = role !== user.role;
  const muniChanged = municipalityId !== (user.municipalityId ?? "");
  const wardsChanged = [...wards].sort().join() !== [...(user.wardAssignments ?? [])].sort().join();
  const dirty = roleChanged || muniChanged || wardsChanged;

  async function onToggleStatus() {
    const next = user.status === "active" ? "disabled" : "active";
    if (!confirm(`${next === "disabled" ? "Disable" : "Enable"} ${user.name}?`)) return;
    setBusy(true);
    try {
      await updateUserMut({ userId: user._id, status: next as "active" | "disabled" });
      toast.success(`User ${next === "disabled" ? "disabled" : "enabled"}`);
      onClose();
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    setBusy(true);
    try {
      const jobs: Promise<unknown>[] = [];

      if (roleChanged) {
        jobs.push(updateUserMut({ userId: user._id, role: role as never }));
      }
      if (!isAdmin && municipalityId && (muniChanged || wardsChanged)) {
        jobs.push(
          assignTenantMut({
            userId: user._id,
            municipalityId: municipalityId as Id<"municipalities">,
            wardAssignments: wards,
          }),
        );
      }

      await Promise.all(jobs);
      toast.success("User updated");
      onClose();
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-5 py-4">
          {/* status row */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <SectionLabel>Status</SectionLabel>
              <Badge variant="outline" className={STATUS_COLORS[user.status] ?? ""}>
                {user.status === "active" ? (
                  <>
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                  </>
                ) : (
                  <>
                    <Ban className="mr-1 h-3 w-3" />
                    {user.status.replace("_", " ")}
                  </>
                )}
              </Badge>
            </div>
            {user.role !== "admin" && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 text-xs",
                  user.status === "active"
                    ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400",
                )}
                onClick={onToggleStatus}
                disabled={busy}
              >
                {user.status === "active" ? (
                  <>
                    <Ban className="h-3 w-3" /> Disable
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3" /> Enable
                  </>
                )}
              </Button>
            )}
          </div>

          {/* role */}
          <div className="space-y-2">
            <SectionLabel>Role</SectionLabel>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                if (v === "admin") {
                  setMunicipalityId("");
                  setWards([]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeRoles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* municipality & wards — not for admin */}
          {!isAdmin && (
            <>
              <Separator />
              <div className="space-y-2">
                <SectionLabel>Municipality (ULB)</SectionLabel>
                <Select
                  value={municipalityId}
                  onValueChange={(v) => {
                    setMunicipalityId(v);
                    setWards([]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a ULB…" />
                  </SelectTrigger>
                  <SelectContent>
                    {munis.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {m.name}
                          <span className="text-xs text-muted-foreground">({m.code})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {user.role !== "admin" && user.municipalityName && municipalityId === (user.municipalityId ?? "") && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" /> Currently: {user.municipalityName}
                  </p>
                )}
              </div>

              {municipalityId && wardsForMuni.length > 0 && (
                <WardPicker wards={wardsForMuni} selected={wards} onChange={setWards} />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <Separator />
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} disabled={busy || !dirty}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </>
  );
}

// ─── main exported sheet ──────────────────────────────────────────────────────

export function UserEditSheet({ user, onClose }: { user: SheetUser | null; onClose: () => void }) {
  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md" showCloseButton>
        {user && (
          <>
            {/* user identity header */}
            <SheetHeader className="border-b border-border px-4 py-4">
              <div className="flex items-start gap-3 pr-8">
                <Avatar>
                  <AvatarFallback className={avatarColor(user.name)}>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="leading-tight">{user.name}</SheetTitle>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {user.kind === "pending" ? (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-100 text-amber-700 text-xs dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300"
                      >
                        <Clock className="mr-1 h-3 w-3" /> Awaiting approval
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className={cn("text-xs", ROLE_COLORS[user.role] ?? "")}>
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[user.status] ?? "")}>
                          {user.status === "active" ? "active" : user.status.replace("_", " ")}
                        </Badge>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">Joined {fmtDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* body — switches on kind */}
            {user.kind === "pending" ? (
              <ApprovePendingPanel user={user} onClose={onClose} />
            ) : (
              <EditListedPanel user={user} onClose={onClose} />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
