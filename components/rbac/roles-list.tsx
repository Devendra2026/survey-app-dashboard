"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ChevronDown, Shield, ShieldOff } from "lucide-react";
import { useMemo, useState } from "react";

export type RoleRow = {
  _id: Id<"roles">;
  key: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  permissionKeys: string[];
  description?: string;
};

type RolesListProps = {
  roles: RoleRow[] | undefined;
  permissionLabels: Map<string, string>;
  permissionCategories: Map<string, string>;
  onToggleActive: (roleId: Id<"roles">, isActive: boolean) => void;
};

const ROLE_ACCENT: Record<string, string> = {
  admin: "border-l-violet-500 bg-violet-500/[0.03] dark:bg-violet-500/[0.06]",
  supervisor: "border-l-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.06]",
  surveyor: "border-l-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
  pending: "border-l-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.06]",
};

const ROLE_ICON_COLOR: Record<string, string> = {
  admin: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  supervisor: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  surveyor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300",
  masters: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300",
  qc: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300",
  surveys: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300",
  reports: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300",
  users: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
}

function RoleCard({
  role,
  permissionLabels,
  permissionCategories,
  onToggleActive,
}: {
  role: RoleRow;
  permissionLabels: Map<string, string>;
  permissionCategories: Map<string, string>;
  onToggleActive: (roleId: Id<"roles">, isActive: boolean) => void;
}) {
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);
  const isOpen = expandedOverride ?? role.isSystem;

  const byCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const key of role.permissionKeys) {
      const cat = permissionCategories.get(key) ?? "other";
      map.set(cat, [...(map.get(cat) ?? []), key]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [role.permissionKeys, permissionCategories]);

  const accent = ROLE_ACCENT[role.key] ?? "border-l-muted-foreground/40 bg-muted/20";
  const iconColor = ROLE_ICON_COLOR[role.key] ?? "bg-muted text-muted-foreground";

  return (
    <div className={cn("rounded-lg border border-border border-l-[3px] transition-shadow hover:shadow-sm", accent)}>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpandedOverride(!isOpen)}
      >
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", iconColor)}>
          <Shield className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{role.name}</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {role.key}
            </code>
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs h-4">
                System
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "h-4 text-[10px]",
                role.isActive
                  ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "border-border text-muted-foreground",
              )}
            >
              {role.isActive ? "Active" : "Inactive"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {role.permissionKeys.length} permission{role.permissionKeys.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {role.description && <p className="mb-3 text-sm text-muted-foreground">{role.description}</p>}
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions assigned.</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(([cat, keys]) => (
                <div key={cat}>
                  <span
                    className={cn(
                      "mb-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      categoryColor(cat),
                    )}
                  >
                    {cat}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {keys.sort().map((key) => (
                      <Badge key={key} variant="outline" className="h-5 text-xs font-normal">
                        {permissionLabels.get(key) ?? key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!role.isSystem ? (
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Button
                variant={role.isActive ? "outline" : "default"}
                size="sm"
                onClick={() => onToggleActive(role._id, role.isActive)}
              >
                {role.isActive ? (
                  <>
                    <ShieldOff className="h-4 w-4" /> Deactivate role
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" /> Activate role
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              System roles are managed via &quot;Refresh system RBAC&quot; and cannot be deactivated here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function RolesList({ roles, permissionLabels, permissionCategories, onToggleActive }: RolesListProps) {
  const sorted = useMemo(
    () =>
      roles
        ? [...roles].sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name))
        : undefined,
    [roles],
  );

  if (sorted === undefined) return <TableSkeleton rows={4} />;

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="No roles"
        description="Create a custom role or refresh system RBAC to seed defaults."
        icon={Shield}
      />
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((role) => (
        <RoleCard
          key={role._id}
          role={role}
          permissionLabels={permissionLabels}
          permissionCategories={permissionCategories}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
}
