"use client";

import { type PermissionOption } from "@/components/rbac/permission-picker";
import { RolesMasterDetail, type RoleRow } from "@/components/rbac/roles-master-detail";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { useCreateRole, usePermissions, useRoles, useSeedRbac, useUpdateRole } from "@/hooks/rbac/useRbac";
import { parseConvexError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
    return filtered.toSorted((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name));
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
              <span className="text-lg font-bold tabular-nums leading-none">{roles === undefined ? "—" : s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        <RolesMasterDetail
          systemRoles={systemRoles}
          customRoles={customRoles}
          selectedId={selectedId}
          mode={mode}
          search={search}
          onSearchChange={setSearch}
          roleCount={roleCount}
          permCount={permCount}
          selectedRole={selectedRole}
          permissionOptions={permissionOptions}
          permissionLabels={permissionLabels}
          permissionCategories={permissionCategories}
          onSelectRole={selectRole}
          onStartCreate={startCreate}
          onSetMode={setMode}
          onToggleActive={onToggleActive}
          onSaveEdit={onSaveEdit}
          onCreateRole={onCreateRole}
        />

        <p className="text-center text-xs text-muted-foreground">
          Surveyors and supervisors receive capabilities from their assigned role on the next app session.
        </p>
      </div>
    </RoleGate>
  );
}
