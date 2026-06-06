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
import {
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserAllotmentsDialog } from "./user-allotments-dialog";

// ─── color maps ────────────────────────────────────────────────────────────────

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

const ROLE_HEADER_BG: Record<string, string> = {
  admin: "from-violet-500/10 to-transparent dark:from-violet-500/20",
  supervisor: "from-blue-500/10 to-transparent dark:from-blue-500/20",
  surveyor: "from-emerald-500/10 to-transparent dark:from-emerald-500/20",
  pending: "from-amber-500/10 to-transparent dark:from-amber-500/20",
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
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ward assignments</Label>
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
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
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

// ─── section block ─────────────────────────────────────────────────────────────

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {action}
      </div>
      {children}
    </div>
  );
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
      <ScrollArea className="flex-1 px-5">
        <div className="space-y-5 py-5">
          {/* request context */}
          {(user.requestedRole || user.requestedReason) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <MessageSquare className="h-3.5 w-3.5" /> Sign-up request
              </p>
              {user.requestedRole && (
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Requested role:</span>
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

          <Section label="Assign role">
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
          </Section>

          {needsMuni && (
            <>
              <Separator />
              <Section label="Municipality (ULB)">
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
              </Section>

              {municipalityId && wardsForMuni.length > 0 && (
                <>
                  <Separator />
                  <WardPicker wards={wardsForMuni} selected={wards} onChange={setWards} />
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-muted/20 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onReject}
            disabled={busy}
          >
            <UserX className="h-4 w-4" /> Reject
          </Button>
          <Button
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onApprove}
            disabled={busy || !canApprove}
          >
            <UserCheck className="h-4 w-4" />
            {busy ? "Approving…" : "Approve user"}
          </Button>
        </div>
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

  // react-doctor-disable-next-line react-doctor/no-derived-useState -- remounted via key={user._id}
  const [role, setRole] = useState(user.role);
  const [municipalityId, setMunicipalityId] = useState<string>(
    user.role !== "admin" ? (user.municipalityId ?? "") : "",
  );
  const [wards, setWards] = useState<string[]>(user.role !== "admin" ? (user.wardAssignments ?? []) : []);
  const [busy, setBusy] = useState(false);
  const [allotDialogOpen, setAllotDialogOpen] = useState(false);

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
      <ScrollArea className="flex-1 px-5">
        <div className="space-y-5 py-5">
          {/* status row */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  user.status === "active"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
                )}
              >
                {user.status === "active" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                <Badge variant="outline" className={cn("mt-0.5 text-xs", STATUS_COLORS[user.status] ?? "")}>
                  {user.status === "active" ? "Active" : user.status.replace("_", " ")}
                </Badge>
              </div>
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
          <Section label="Role">
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
          </Section>

          {/* municipality & wards */}
          {!isAdmin && (
            <>
              <Separator />
              <Section label="Municipality (ULB)">
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
              </Section>

              {municipalityId && wardsForMuni.length > 0 && (
                <>
                  <Separator />
                  <WardPicker wards={wardsForMuni} selected={wards} onChange={setWards} />
                </>
              )}
            </>
          )}

          {/* multi-city allotments */}
          {!isAdmin && (
            <>
              <Separator />
              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4 dark:border-blue-500/30 dark:bg-blue-500/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Multi-city allotments</p>
                      <p className="text-[11px] text-muted-foreground">
                        Assign this user to multiple districts or ULBs simultaneously
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 border-blue-200 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-500/40 dark:text-blue-400 dark:hover:bg-blue-500/10"
                    onClick={() => setAllotDialogOpen(true)}
                  >
                    Manage cities
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-muted/20 px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={busy || !dirty}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {!isAdmin && (
        <UserAllotmentsDialog
          open={allotDialogOpen}
          onOpenChange={setAllotDialogOpen}
          user={{ _id: user._id, name: user.name, role: user.role }}
        />
      )}
    </>
  );
}

// ─── main exported sheet ──────────────────────────────────────────────────────

export function UserEditSheet({ user, onClose }: { user: SheetUser | null; onClose: () => void }) {
  const role = user?.kind === "listed" ? user.role : user?.kind === "pending" ? "pending" : null;
  const headerBg = role ? (ROLE_HEADER_BG[role] ?? "from-muted/50 to-transparent") : "";

  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md" showCloseButton>
        {user && (
          <>
            {/* identity header with role-tinted gradient */}
            <SheetHeader className={cn("border-b border-border bg-linear-to-b px-5 py-5", headerBg)}>
              <div className="flex items-start gap-4 pr-8">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={cn("text-sm font-bold", avatarColor(user.name))}>
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {user.kind === "listed" && (
                    <span
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background",
                        user.status === "active" ? "bg-emerald-500" : "bg-red-500",
                      )}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base leading-tight">{user.name}</SheetTitle>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {user.kind === "pending" ? (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-100 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300"
                      >
                        <Clock className="mr-1 h-3 w-3" /> Awaiting approval
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className={cn("text-xs", ROLE_COLORS[user.role] ?? "")}>
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[user.status] ?? "")}>
                          {user.status === "active" ? "Active" : user.status.replace("_", " ")}
                        </Badge>
                      </>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" /> {fmtDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {user.kind === "pending" ? (
              <ApprovePendingPanel user={user} onClose={onClose} />
            ) : (
              <EditListedPanel key={user._id} user={user} onClose={onClose} />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
