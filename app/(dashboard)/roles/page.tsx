"use client";

import { PermissionPicker, type PermissionOption } from "@/components/rbac/permission-picker";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Id } from "@/convex/_generated/dataModel";
import { useCreateRole, usePermissions, useRoles, useSeedRbac, useUpdateRole } from "@/hooks/rbac/useRbac";
import { parseConvexError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Edit2,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── types ────────────────────────────────────────────────────────────────────

type RoleRow = {
  _id: Id<"roles">;
  key: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  permissionKeys: string[];
  description?: string;
};

// ─── constants ────────────────────────────────────────────────────────────────

const ROLE_ACCENT: Record<string, { border: string; icon: string }> = {
  admin: {
    border: "border-l-violet-500",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  },
  supervisor: {
    border: "border-l-blue-500",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  surveyor: {
    border: "border-l-emerald-500",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  pending: {
    border: "border-l-amber-500",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  },
};

const DEFAULT_ACCENT = {
  border: "border-l-slate-400",
  icon: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  admin:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30",
  masters: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30",
  qc: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
  surveys:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  reports: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  users: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30",
};

function catColor(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
}

// ─── sidebar item ─────────────────────────────────────────────────────────────

function RoleItem({ role, selected, onClick }: { role: RoleRow; selected: boolean; onClick: () => void }) {
  const accent = ROLE_ACCENT[role.key] ?? DEFAULT_ACCENT;

  if (role.isSystem) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group w-full rounded-lg border border-l-[3px] px-3 py-2.5 text-left transition-all",
          accent.border,
          selected
            ? "border-slate-300 bg-slate-100 shadow-sm ring-1 ring-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:ring-slate-600"
            : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/80",
          !role.isActive && "opacity-50",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", accent.icon)}>
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                {role.name}
              </span>
              <span className="shrink-0 rounded bg-slate-200 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                SYS
              </span>
              {!role.isActive && (
                <span className="shrink-0 rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold uppercase text-red-500">
                  off
                </span>
              )}
            </div>
            <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              {role.key}
              <span className="ml-1.5 font-sans not-italic">· {role.permissionKeys.length} perms</span>
            </p>
          </div>
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600", selected && "text-slate-500 dark:text-slate-400")} />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-lg border px-3 py-2.5 text-left transition-all",
        selected
          ? "border-violet-300 bg-violet-50 shadow-sm ring-1 ring-violet-200 dark:border-violet-700 dark:bg-violet-500/10 dark:ring-violet-700"
          : "border-border bg-card hover:border-violet-200 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-500/5",
        !role.isActive && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
          <Shield className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("truncate text-sm font-semibold", selected ? "text-violet-700 dark:text-violet-300" : "text-foreground")}>
              {role.name}
            </span>
            <span className="shrink-0 rounded bg-violet-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              CUSTOM
            </span>
            {!role.isActive && (
              <span className="shrink-0 rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold uppercase text-red-500">
                off
              </span>
            )}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            {role.key}
            <span className="ml-1.5 font-sans not-italic">· {role.permissionKeys.length} perms</span>
          </p>
        </div>
        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground/40", selected && "text-violet-500 opacity-100")} />
      </div>
    </button>
  );
}

// ─── permission view ──────────────────────────────────────────────────────────

function PermissionMatrix({
  role,
  permissionLabels,
  permissionCategories,
}: {
  role: RoleRow;
  permissionLabels: Map<string, string>;
  permissionCategories: Map<string, string>;
}) {
  const byCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const key of role.permissionKeys) {
      const cat = permissionCategories.get(key) ?? "other";
      map.set(cat, [...(map.get(cat) ?? []), key]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [role.permissionKeys, permissionCategories]);

  if (byCategory.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 py-8 text-center">
        <p className="text-sm text-muted-foreground">No permissions assigned to this role.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {byCategory.map(([cat, keys]) => (
        <div
          key={cat}
          className="rounded-xl border border-border bg-muted/20 p-3"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                catColor(cat),
              )}
            >
              {cat}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {keys.length}
            </span>
          </div>
          <ul className="space-y-1">
            {keys.sort().map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                <span className="text-xs text-foreground/80">{permissionLabels.get(key) ?? key}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── role detail view panel ────────────────────────────────────────────────────

function RoleDetailView({
  role,
  permissionLabels,
  permissionCategories,
  onEdit,
  onToggleActive,
}: {
  role: RoleRow;
  permissionLabels: Map<string, string>;
  permissionCategories: Map<string, string>;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const accent = ROLE_ACCENT[role.key] ?? DEFAULT_ACCENT;

  return (
    <div className="flex h-full flex-col">
      {/* role header */}
      <div className={cn("border-b border-l-4 px-5 py-4", accent.border)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", accent.icon)}>
              {role.isSystem ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold leading-tight">{role.name}</h2>
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {role.key}
                </code>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {role.isSystem && (
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <Lock className="h-2.5 w-2.5" /> System
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    role.isActive
                      ? "border-emerald-200 bg-emerald-100 text-[11px] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "text-[11px] text-muted-foreground"
                  }
                >
                  {role.isActive ? (
                    <><CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Active</>
                  ) : (
                    <><ShieldOff className="mr-1 h-2.5 w-2.5" /> Inactive</>
                  )}
                </Badge>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {role.permissionKeys.length} permission{role.permissionKeys.length !== 1 ? "s" : ""}
                </span>
              </div>
              {role.description && <p className="mt-1.5 text-xs text-muted-foreground">{role.description}</p>}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Edit permissions
            </Button>
            {!role.isSystem && (
              <Button
                size="sm"
                variant={role.isActive ? "outline" : "default"}
                onClick={onToggleActive}
                className={cn("gap-1.5", role.isActive && "border-destructive/40 text-destructive hover:bg-destructive/10")}
              >
                {role.isActive ? (
                  <><ShieldOff className="h-3.5 w-3.5" /> Deactivate</>
                ) : (
                  <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* permissions body */}
      <ScrollArea className="flex-1 px-5 py-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Permissions</p>
        <PermissionMatrix role={role} permissionLabels={permissionLabels} permissionCategories={permissionCategories} />

        {role.isSystem && (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This is a <strong>system role</strong>. You can customize its permissions, but running
              &ldquo;Refresh system RBAC&rdquo; will reset them to defaults.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── role edit panel ──────────────────────────────────────────────────────────

function RoleEditPanel({
  role,
  permissionOptions,
  onSave,
  onCancel,
}: {
  role: RoleRow;
  permissionOptions: PermissionOption[];
  onSave: (patch: { name: string; description: string; permissionKeys: string[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [perms, setPerms] = useState<string[]>(role.permissionKeys);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      await onSave({ name, description, permissionKeys: perms });
    } finally {
      setBusy(false);
    }
  }

  const dirty =
    name !== role.name ||
    description !== (role.description ?? "") ||
    perms.join() !== [...role.permissionKeys].sort().join();

  return (
    <div className="flex h-full flex-col">
      {/* edit header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-semibold">Editing: {role.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{role.key}</p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={busy || !name.trim() || perms.length === 0 || !dirty}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-5">
          {/* system role warning */}
          {role.isSystem && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Editing a system role</p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  Custom permission changes will be overwritten if you click &ldquo;Refresh system RBAC&rdquo;.
                </p>
              </div>
            </div>
          )}

          {/* name & description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Display name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="QC Lead" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Key (read-only)</Label>
              <Input value={role.key} readOnly className="font-mono text-sm bg-muted/50 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description (optional)</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role's responsibilities"
              rows={2}
            />
          </div>

          {/* permission picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              {perms.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {perms.length} selected
                </Badge>
              )}
            </div>
            <PermissionPicker permissions={permissionOptions} selected={perms} onChange={setPerms} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── create role panel ────────────────────────────────────────────────────────

function CreateRolePanel({
  permissionOptions,
  onCreate,
  onCancel,
}: {
  permissionOptions: PermissionOption[];
  onCreate: (data: { key: string; name: string; description: string; permissionKeys: string[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    try {
      await onCreate({ key, name, description, permissionKeys: perms });
    } finally {
      setBusy(false);
    }
  }

  const canCreate = key.trim().length >= 2 && name.trim().length > 0 && perms.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* create header */}
      <div className="flex items-center justify-between border-b border-border bg-violet-500/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" /> New Custom Role
            </p>
            <p className="text-[11px] text-muted-foreground">Assign a slug, name and permissions</p>
          </div>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={busy || !canCreate}>
          {busy ? "Creating…" : "Create role"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-key">
                Key (slug){" "}
                <span className="text-[10px] text-muted-foreground font-normal">lowercase, underscores OK</span>
              </Label>
              <Input
                id="new-key"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="qc_lead"
                autoComplete="off"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Display name</Label>
              <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="QC Lead" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-desc">Description (optional)</Label>
            <Textarea
              id="new-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role's responsibilities"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              {perms.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {perms.length} selected
                </Badge>
              )}
            </div>
            <PermissionPicker permissions={permissionOptions} selected={perms} onChange={setPerms} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const roles = useRoles({ includeInactive: true }) as RoleRow[] | undefined;
  const permissions = usePermissions();
  const seedFn = useSeedRbac();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const [selectedId, setSelectedId] = useState<Id<"roles"> | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);

  const permissionOptions = useMemo<PermissionOption[]>(
    () => (permissions ?? []).map((p) => ({ key: p.key, label: p.label, category: p.category })),
    [permissions],
  );
  const permissionLabels = useMemo(
    () => new Map((permissions ?? []).map((p) => [p.key, p.label] as const)),
    [permissions],
  );
  const permissionCategories = useMemo(
    () => new Map((permissions ?? []).map((p) => [p.key, p.category] as const)),
    [permissions],
  );

  const sorted = useMemo(() => {
    if (!roles) return undefined;
    const q = search.trim().toLowerCase();
    const filtered = q
      ? roles.filter((r) => r.name.toLowerCase().includes(q) || r.key.toLowerCase().includes(q))
      : roles;
    return [...filtered].sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name));
  }, [roles, search]);

  const systemRoles = sorted?.filter((r) => r.isSystem) ?? [];
  const customRoles = sorted?.filter((r) => !r.isSystem) ?? [];
  const selectedRole = roles?.find((r) => r._id === selectedId);

  function selectRole(id: Id<"roles">) {
    setSelectedId(id);
    setMode("view");
  }

  function startCreate() {
    setSelectedId(null);
    setMode("create");
  }

  async function onSeed() {
    setSeeding(true);
    try {
      await seedFn({});
      toast.success("System roles and permissions refreshed");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    } finally {
      setSeeding(false);
    }
  }

  async function onToggleActive(role: RoleRow) {
    try {
      await updateRole({ roleId: role._id, isActive: !role.isActive });
      toast.success(role.isActive ? "Role deactivated" : "Role activated");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  async function onSaveEdit(patch: { name: string; description: string; permissionKeys: string[] }) {
    if (!selectedRole) return;
    try {
      await updateRole({
        roleId: selectedRole._id,
        name: patch.name,
        description: patch.description || undefined,
        permissionKeys: patch.permissionKeys,
      });
      toast.success("Role updated");
      setMode("view");
    } catch (e) {
      toast.error(parseConvexError(e).message);
      throw e;
    }
  }

  async function onCreateRole(data: { key: string; name: string; description: string; permissionKeys: string[] }) {
    try {
      const newId = (await createRole({
        key: data.key,
        name: data.name,
        description: data.description || undefined,
        permissionKeys: data.permissionKeys,
      })) as Id<"roles">;
      toast.success("Role created");
      setSelectedId(newId);
      setMode("view");
    } catch (e) {
      toast.error(parseConvexError(e).message);
      throw e;
    }
  }

  const roleCount = roles?.length ?? 0;
  const activeCount = roles?.filter((r) => r.isActive).length ?? 0;
  const customCount = roles?.filter((r) => !r.isSystem).length ?? 0;
  const permCount = permissions?.length ?? 0;

  return (
    <RoleGate
      mode="page"
      capability="roles.manage"
      deniedDescription="Only administrators can manage roles and permissions."
    >
      <div className="space-y-4">
        <PageHeader
          title="Roles & Permissions"
          description="Define who can do what on web and mobile. Changes apply after the next capability sync."
          actions={
            <Button variant="outline" size="sm" onClick={onSeed} disabled={seeding}>
              <RefreshCw className={cn("h-4 w-4", seeding && "animate-spin")} />
              Refresh system RBAC
            </Button>
          }
        />

        {/* compact stats row */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Roles", value: roleCount, dot: "bg-primary" },
            { label: "Active", value: activeCount, dot: "bg-emerald-500" },
            { label: "Custom", value: customCount, dot: "bg-violet-500" },
            { label: "Permissions", value: permCount, dot: "bg-blue-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
            >
              <span className={cn("h-2 w-2 rounded-full", s.dot)} />
              <span className="text-lg font-bold tabular-nums leading-none">
                {roles === undefined ? "—" : s.value}
              </span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* master-detail panel */}
        <div className="flex gap-4 rounded-xl border border-border bg-card shadow-sm" style={{ minHeight: 600 }}>
          {/* ── LEFT: role sidebar ───────────────────────────────────────── */}
          <div className="flex w-72 shrink-0 flex-col border-r border-border">
            {/* sidebar header */}
            <div className="flex items-center justify-between border-b border-border px-3 py-3">
              <p className="text-sm font-semibold text-foreground">Roles</p>
              <Button size="sm" className="h-7 gap-1 text-xs" onClick={startCreate}>
                <Plus className="h-3.5 w-3.5" /> New role
              </Button>
            </div>

            {/* search */}
            <div className="border-b border-border px-3 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter roles…"
                  className="h-7 pl-7 text-xs"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-3 py-2">
              {/* system roles */}
              {systemRoles.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between rounded-md bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        System Roles
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      {systemRoles.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {systemRoles.map((r) => (
                      <RoleItem
                        key={r._id}
                        role={r}
                        selected={selectedId === r._id && mode !== "create"}
                        onClick={() => selectRole(r._id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* custom roles */}
              <div>
                <div className="mb-2 flex items-center justify-between rounded-md bg-violet-50 px-2.5 py-1.5 dark:bg-violet-500/10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Custom Roles
                    </p>
                  </div>
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                    {customRoles.length}
                  </span>
                </div>
                {customRoles.length === 0 ? (
                  <button
                    type="button"
                    onClick={startCreate}
                    className="w-full rounded-lg border border-dashed border-violet-200 px-3 py-4 text-center text-xs text-violet-400 transition-colors hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-600 dark:border-violet-800 dark:hover:bg-violet-500/5"
                  >
                    <Sparkles className="mx-auto mb-1.5 h-4 w-4" />
                    <p className="font-medium">No custom roles yet</p>
                    <p className="mt-0.5 text-[11px]">Click &ldquo;+ New role&rdquo; to create one</p>
                  </button>
                ) : (
                  <div className="space-y-1">
                    {customRoles.map((r) => (
                      <RoleItem
                        key={r._id}
                        role={r}
                        selected={selectedId === r._id && mode !== "create"}
                        onClick={() => selectRole(r._id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* sidebar footer */}
            <div className="border-t border-border px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                {roleCount} role{roleCount !== 1 ? "s" : ""} · {permCount} permission key
                {permCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* ── RIGHT: detail / create panel ────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col">
            {mode === "create" ? (
              <CreateRolePanel
                permissionOptions={permissionOptions}
                onCreate={onCreateRole}
                onCancel={() => setMode("view")}
              />
            ) : selectedRole ? (
              mode === "edit" ? (
                <RoleEditPanel
                  key={selectedRole._id}
                  role={selectedRole}
                  permissionOptions={permissionOptions}
                  onSave={onSaveEdit}
                  onCancel={() => setMode("view")}
                />
              ) : (
                <RoleDetailView
                  role={selectedRole}
                  permissionLabels={permissionLabels}
                  permissionCategories={permissionCategories}
                  onEdit={() => setMode("edit")}
                  onToggleActive={() => onToggleActive(selectedRole)}
                />
              )
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-muted shadow-sm">
                  <Key className="h-7 w-7 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {roleCount}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold">Select a role to inspect</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose any role from the sidebar to view its permissions
                    <br />
                    or create a new custom role below.
                  </p>
                </div>
                <Button size="sm" onClick={startCreate} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New custom role
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Surveyors and supervisors receive capabilities from their assigned role on the next app session.
        </p>
      </div>
    </RoleGate>
  );
}
