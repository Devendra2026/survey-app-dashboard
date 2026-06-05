"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { UserAllotmentsDialog } from "@/components/users/user-allotments-dialog";
import {
  UserEditSheet,
  type SheetListedUser,
  type SheetPendingUser,
  type SheetUser,
} from "@/components/users/user-edit-sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRoles } from "@/hooks/rbac/useRbac";
import { usePendingApprovals, useUserListPaginated, type UserListFilters } from "@/hooks/users/useUsers";
import { cn, fmtDate } from "@/lib/utils";
import type { FunctionReturnType } from "convex/server";
import {
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  UserCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type PendingUser = FunctionReturnType<typeof api.admin.listPendingApprovals>[number];
type ListedUser = FunctionReturnType<typeof api.admin.listUsers>["page"][number];
type AllotUser = { _id: Id<"users">; name: string; role: string };

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

const ROLE_DOT: Record<string, string> = {
  admin: "bg-violet-500",
  supervisor: "bg-blue-500",
  surveyor: "bg-emerald-500",
  pending: "bg-amber-500",
};

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  pending_approval:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  disabled: "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
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

// ─── adapter helpers ──────────────────────────────────────────────────────────

function toPendingSheet(u: PendingUser): SheetPendingUser {
  return {
    kind: "pending",
    _id: u._id as Id<"users">,
    name: u.name,
    email: u.email,
    requestedRole: u.requestedRole ?? undefined,
    requestedReason: u.requestedReason ?? undefined,
    createdAt: u.createdAt,
  };
}

function toListedSheet(u: ListedUser): SheetListedUser {
  return {
    kind: "listed",
    _id: u._id as Id<"users">,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    municipalityId: u.municipalityId as Id<"municipalities"> | null | undefined,
    municipalityName: u.municipalityName,
    wardAssignments: u.wardAssignments,
    createdAt: u.createdAt,
  };
}

const ALL = "__all__";

function isFieldRole(role: string) {
  return role === "supervisor" || role === "surveyor";
}

function pendingAge(createdAt: number) {
  const days = Math.floor((Date.now() - createdAt) / 86_400_000);
  if (days === 0) return { label: "Today", urgent: false };
  if (days === 1) return { label: "Yesterday", urgent: false };
  if (days <= 3) return { label: `${days}d ago`, urgent: false };
  return { label: `${days}d ago`, urgent: true };
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  iconCls,
  borderCls,
  bgCls,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconCls: string;
  borderCls: string;
  bgCls: string;
}) {
  return (
    <Card className={cn("border-l-4 transition-shadow hover:shadow-md", borderCls, bgCls)}>
      <CardContent className="flex items-center gap-4 py-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm", iconCls)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const pending = usePendingApprovals();
  const allRoles = useRoles({ includeInactive: false });
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [sheetUser, setSheetUser] = useState<SheetUser | null>(null);
  const [allotUser, setAllotUser] = useState<AllotUser | null>(null);

  const listFilters = useMemo((): UserListFilters => {
    const f: UserListFilters = {};
    if (roleFilter !== ALL) f.role = roleFilter as UserListFilters["role"];
    if (statusFilter !== ALL) f.status = statusFilter as UserListFilters["status"];
    return f;
  }, [roleFilter, statusFilter]);

  const {
    users,
    isLoading,
    pageNumber,
    pageSize: rowsPerPage,
    canGoPrev,
    canGoNext,
    goNext,
    goPrev,
  } = useUserListPaginated(listFilters, pageSize);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users?.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const activeCount = users?.filter((u) => u.status === "active").length ?? 0;
  const disabledCount = users?.filter((u) => u.status === "disabled").length ?? 0;

  const hasFilters = roleFilter !== ALL || statusFilter !== ALL || search.trim().length > 0;

  function clearFilters() {
    setRoleFilter(ALL);
    setStatusFilter(ALL);
    setSearch("");
  }

  return (
    <RoleGate
      mode="page"
      capability="users.view"
      deniedDescription="User management is restricted to supervisors and administrators."
    >
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Approve registrations, assign roles & tenancy, and manage access."
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Pending Approval"
            value={pending?.length ?? "—"}
            icon={Clock}
            borderCls="border-l-amber-500"
            iconCls="bg-amber-500 text-white"
            bgCls="dark:bg-amber-500/5"
          />
          <KpiCard
            label="Total Users"
            value={users?.length ?? "—"}
            icon={Users}
            borderCls="border-l-primary"
            iconCls="bg-primary text-primary-foreground"
            bgCls=""
          />
          <KpiCard
            label="Active"
            value={users ? activeCount : "—"}
            icon={CheckCircle2}
            borderCls="border-l-emerald-500"
            iconCls="bg-emerald-500 text-white"
            bgCls="dark:bg-emerald-500/5"
          />
          <KpiCard
            label="Disabled"
            value={users ? disabledCount : "—"}
            icon={Ban}
            borderCls="border-l-rose-500"
            iconCls="bg-rose-500 text-white"
            bgCls="dark:bg-rose-500/5"
          />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="h-10 gap-1 rounded-xl p-1">
            <TabsTrigger value="pending" className="rounded-lg px-4">
              Pending
              {pending?.length ? (
                <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {pending.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg px-4">
              All Users
              {users?.length ? (
                <span className="ml-2 text-[11px] text-muted-foreground">{users.length}</span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* ── Pending tab ─────────────────────────────────────────────────── */}
          <TabsContent value="pending" className="mt-4">
            <Card className="overflow-hidden border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30 px-5 py-3.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-500/20">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Approval Queue
                  <span className="font-normal text-muted-foreground">— click a row to review</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pending === undefined ? (
                  <div className="p-5">
                    <TableSkeleton rows={3} />
                  </div>
                ) : pending.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      title="Queue is clear"
                      description="New sign-ups awaiting approval will appear here."
                      icon={UserCheck}
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pending.map((u) => {
                      const age = pendingAge(u.createdAt);
                      return (
                        <div
                          key={u._id}
                          className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                          onClick={() => setSheetUser(toPendingSheet(u))}
                        >
                          <Avatar>
                            <AvatarFallback className={cn("text-sm font-semibold", avatarColor(u.name))}>
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-tight">{u.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {u.requestedRole && (
                              <Badge variant="outline" className={cn("text-xs", ROLE_COLORS[u.requestedRole] ?? "")}>
                                {u.requestedRole}
                              </Badge>
                            )}
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                age.urgent
                                  ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {age.label}
                            </span>
                            <RoleGate capability="users.approve" fallback={null}>
                              <Button
                                size="sm"
                                className="h-7 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSheetUser(toPendingSheet(u));
                                }}
                              >
                                <UserCheck className="h-3 w-3" /> Review
                              </Button>
                            </RoleGate>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── All users tab ────────────────────────────────────────────────── */}
          <TabsContent value="all" className="mt-4">
            <Card className="overflow-hidden border-border shadow-sm">
              {/* toolbar */}
              <CardHeader className="border-b border-border bg-muted/30 px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted-foreground/10">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    User Directory
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email…"
                        className="h-8 w-52 pl-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="h-8 w-32" aria-label="Filter by role">
                          <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All roles</SelectItem>
                          {allRoles
                            ? allRoles.map((r) => (
                                <SelectItem key={r.key} value={r.key}>
                                  <span className="flex items-center gap-1.5">
                                    {r.isSystem ? (
                                      <span className="rounded bg-slate-200 px-1 py-0.5 text-[9px] font-bold uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                        SYS
                                      </span>
                                    ) : (
                                      <span className="rounded bg-violet-100 px-1 py-0.5 text-[9px] font-bold uppercase text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                                        CUSTOM
                                      </span>
                                    )}
                                    {r.name}
                                  </span>
                                </SelectItem>
                              ))
                            : ["admin", "supervisor", "surveyor", "pending"].map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 w-36" aria-label="Filter by status">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending_approval">Pending approval</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                      {hasFilters && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={clearFilters}
                        >
                          <X className="h-3.5 w-3.5" /> Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-5">
                    <TableSkeleton rows={6} />
                  </div>
                ) : filteredUsers?.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      title="No users match"
                      description="Try clearing filters or check back after new registrations."
                      icon={UserCheck}
                    />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border bg-muted/20 hover:bg-muted/20">
                          <TableHead className="pl-5 font-semibold text-foreground">User</TableHead>
                          <TableHead className="font-semibold text-foreground">Role</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground">Municipality</TableHead>
                          <TableHead className="font-semibold text-foreground">Wards</TableHead>
                          <TableHead className="font-semibold text-foreground">Joined</TableHead>
                          <TableHead className="w-20 pr-5 text-right font-semibold text-foreground">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers?.map((u) => (
                          <TableRow
                            key={u._id}
                            className="cursor-pointer border-border transition-colors hover:bg-muted/30"
                            onClick={() => setSheetUser(toListedSheet(u))}
                          >
                            <TableCell className="py-3 pl-5">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar size="sm">
                                    <AvatarFallback className={cn("text-xs font-semibold", avatarColor(u.name))}>
                                      {initials(u.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span
                                    className={cn(
                                      "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                                      ROLE_DOT[u.role] ?? "bg-muted-foreground",
                                    )}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold leading-tight">{u.name}</p>
                                  <p className="max-w-44 truncate text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs", ROLE_COLORS[u.role] ?? "")}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[u.status] ?? "")}>
                                {u.status === "pending_approval" ? "pending" : u.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {u.role !== "admin" && u.municipalityName ? (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  <span className="max-w-32 truncate">{u.municipalityName}</span>
                                </div>
                              ) : u.role !== "admin" && u.districtName ? (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  <span className="max-w-32 truncate">{u.districtName}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {u.role !== "admin" && u.wardAssignments?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {u.wardAssignments.slice(0, 3).map((w) => (
                                    <span
                                      key={w}
                                      className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                    >
                                      {w}
                                    </span>
                                  ))}
                                  {u.wardAssignments.length > 3 && (
                                    <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                      +{u.wardAssignments.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {fmtDate(u.createdAt)}
                            </TableCell>
                            <TableCell className="pr-5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end">
                                {isFieldRole(u.role) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"
                                        onClick={() =>
                                          setAllotUser({
                                            _id: u._id as Id<"users">,
                                            name: u.name,
                                            role: u.role,
                                          })
                                        }
                                      >
                                        <Layers className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Manage city allotments</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="border-t border-border px-5 py-2">
                      <TablePagination
                        pageNumber={pageNumber}
                        pageSize={rowsPerPage}
                        itemCount={filteredUsers?.length ?? 0}
                        canGoPrev={canGoPrev}
                        canGoNext={canGoNext}
                        onPrev={goPrev}
                        onNext={goNext}
                        onPageSizeChange={setPageSize}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UserEditSheet user={sheetUser} onClose={() => setSheetUser(null)} />

        <UserAllotmentsDialog
          open={!!allotUser}
          onOpenChange={(o) => !o && setAllotUser(null)}
          user={allotUser}
        />
      </div>
    </RoleGate>
  );
}
