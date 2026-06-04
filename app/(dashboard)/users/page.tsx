"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type SheetListedUser, type SheetPendingUser, type SheetUser, UserEditSheet } from "@/components/users/user-edit-sheet";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { usePendingApprovals, useUserListPaginated, type UserListFilters } from "@/hooks/users/useUsers";
import { fmtDate } from "@/lib/utils";
import type { FunctionReturnType } from "convex/server";
import { Ban, Clock, MapPin, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";

type PendingUser = FunctionReturnType<typeof api.admin.listPendingApprovals>[number];
type ListedUser = FunctionReturnType<typeof api.admin.listUsers>["page"][number];

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

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  pending_approval:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  disabled:
    "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const pending = usePendingApprovals();
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [sheetUser, setSheetUser] = useState<SheetUser | null>(null);

  const listFilters = useMemo((): UserListFilters => {
    const f: UserListFilters = {};
    if (roleFilter !== ALL) f.role = roleFilter as UserListFilters["role"];
    if (statusFilter !== ALL) f.status = statusFilter as UserListFilters["status"];
    return f;
  }, [roleFilter, statusFilter]);

  const { users, isLoading, pageNumber, pageSize: rowsPerPage, canGoPrev, canGoNext, goNext, goPrev } =
    useUserListPaginated(listFilters, pageSize);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users?.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const activeCount = users?.filter((u) => u.status === "active").length ?? 0;
  const disabledCount = users?.filter((u) => u.status === "disabled").length ?? 0;

  return (
    <RoleGate
      capability="users.view"
      fallback={<EmptyState title="Not permitted" description="User management is restricted to administrators." />}
    >
      <div className="space-y-5">
        <PageHeader
          title="Users"
          description="Approve registrations, assign roles & tenancy, and manage access."
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-l-[3px] border-l-amber-500 bg-amber-500/4 dark:bg-amber-500/8">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{pending?.length ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Pending Approval</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-[3px] border-l-primary bg-card">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{users?.length ?? "—"}</p>
                <p className="text-xs text-muted-foreground">On this page</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-[3px] border-l-emerald-500 bg-emerald-500/4 dark:bg-emerald-500/8">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{users ? activeCount : "—"}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-[3px] border-l-rose-500 bg-rose-500/4 dark:bg-rose-500/8">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/20">
                <Ban className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{users ? disabledCount : "—"}</p>
                <p className="text-xs text-muted-foreground">Disabled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Approval
              {pending?.length ? (
                <Badge
                  variant="outline"
                  className="ml-2 border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300"
                >
                  {pending.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="all">All Users</TabsTrigger>
          </TabsList>

          {/* ── Pending tab ─────────────────────────────────────────────────── */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Approval queue
                  <span className="text-xs font-normal text-muted-foreground">
                    — click a row to review and approve
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pending === undefined ? (
                  <TableSkeleton rows={3} />
                ) : pending.length === 0 ? (
                  <EmptyState
                    title="No pending requests"
                    description="New sign-ups awaiting approval will appear here."
                    icon={UserCheck}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead>User</TableHead>
                          <TableHead>Requested Role</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="w-32 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending.map((u) => (
                          <TableRow
                            key={u._id}
                            className="cursor-pointer hover:bg-muted/30"
                            onClick={() => setSheetUser(toPendingSheet(u))}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar size="sm">
                                  <AvatarFallback className={avatarColor(u.name)}>
                                    {initials(u.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium leading-tight">{u.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {u.requestedRole ? (
                                <Badge variant="outline" className={ROLE_COLORS[u.requestedRole] ?? ""}>
                                  {u.requestedRole}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                              {u.requestedReason ?? "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {fmtDate(u.createdAt)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <RoleGate capability="users.approve">
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    className="h-7 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSheetUser(toPendingSheet(u));
                                    }}
                                  >
                                    <UserCheck className="h-3.5 w-3.5" /> Review
                                  </Button>
                                </div>
                              </RoleGate>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── All users tab ────────────────────────────────────────────────── */}
          <TabsContent value="all">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Directory
                  <span className="text-xs font-normal text-muted-foreground">
                    — click a row to edit
                  </span>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or email…"
                      className="h-8 w-52 pl-8"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-8 w-32.5" aria-label="Filter by role">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="surveyor">Surveyor</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-37.5" aria-label="Filter by status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending_approval">Pending approval</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-0">
                {isLoading ? (
                  <TableSkeleton rows={6} />
                ) : filteredUsers?.length === 0 ? (
                  <EmptyState
                    title="No users match"
                    description="Try clearing filters or check back after new registrations."
                    icon={UserCheck}
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Municipality</TableHead>
                            <TableHead>Wards</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers?.map((u) => (
                            <TableRow
                              key={u._id}
                              className="cursor-pointer hover:bg-muted/30"
                              onClick={() => setSheetUser(toListedSheet(u))}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar size="sm">
                                    <AvatarFallback className={avatarColor(u.name)}>
                                      {initials(u.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-medium leading-tight">{u.name}</p>
                                    <p className="max-w-44 truncate text-xs text-muted-foreground">
                                      {u.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={ROLE_COLORS[u.role] ?? ""}>
                                  {u.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={STATUS_COLORS[u.status] ?? ""}>
                                  {u.status === "pending_approval" ? "pending" : u.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {u.role !== "admin" && u.municipalityName ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    {u.municipalityName}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-36 truncate text-sm text-muted-foreground">
                                {u.role !== "admin" && u.wardAssignments?.length
                                  ? u.wardAssignments.join(", ")
                                  : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {fmtDate(u.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* slide-in edit / approve panel */}
        <UserEditSheet user={sheetUser} onClose={() => setSheetUser(null)} />
      </div>
    </RoleGate>
  );
}
