"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApproveUserDialog } from "@/components/users/approve-user-dialog";
import { UserAllotmentsDialog } from "@/components/users/user-allotments-dialog";
import { api } from "@/convex/_generated/api";
import {
  useDisableUser,
  usePendingApprovals,
  useRejectUser,
  useUserListPaginated,
  type UserListFilters,
} from "@/hooks/users/useUsers";
import { parseConvexError } from "@/lib/errors";
import { fmtDate } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { FunctionReturnType } from "convex/server";
import { Ban, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type BadgeTone = "default" | "success" | "muted" | "warning" | "destructive";
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
type PendingUser = FunctionReturnType<typeof api.admin.listPendingApprovals>[number];
type ListedUser = FunctionReturnType<typeof api.admin.listUsers>["page"][number];

function badgeVariantForTone(tone: BadgeTone): BadgeVariant {
  if (tone === "destructive") return "destructive";
  if (tone === "success" || tone === "default") return "default";
  return "outline";
}

const ROLE_TONE: Record<string, BadgeTone> = {
  admin: "default",
  supervisor: "success",
  surveyor: "muted",
  pending: "warning",
};
const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  pending_approval: "warning",
  disabled: "destructive",
};

const ALL_FILTER = "__all__";

export default function UsersPage() {
  const pending = usePendingApprovals();
  const [roleFilter, setRoleFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [pageSize, setPageSize] = useState(15);

  const listFilters = useMemo((): UserListFilters => {
    const f: UserListFilters = {};
    if (roleFilter !== ALL_FILTER) f.role = roleFilter as UserListFilters["role"];
    if (statusFilter !== ALL_FILTER) f.status = statusFilter as UserListFilters["status"];
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

  const reject = useRejectUser();
  const disable = useDisableUser();
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null);
  const [allotmentTarget, setAllotmentTarget] = useState<ListedUser | null>(null);

  async function onReject(u: PendingUser) {
    if (!confirm(`Reject ${u.name}? Their account will be disabled.`)) return;
    try {
      await reject({ userId: u._id });
      toast.success("User rejected");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }
  async function onDisable(u: ListedUser) {
    if (!confirm(`Disable ${u.name}?`)) return;
    try {
      await disable(u._id);
      toast.success("User disabled");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  return (
    <RoleGate
      capability="users.view"
      fallback={<EmptyState title="Not permitted" description="User management is restricted to administrators." />}
    >
      <div className="space-y-5">
        <PageHeader title="Users" description="Approve registrations, assign roles & tenancy, and manage access." />

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Approval{" "}
              {pending?.length ? (
                <Badge variant={badgeVariantForTone("warning")} className="ml-2">
                  {pending.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="all">All Users</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending approval queue</CardTitle>
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
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="w-35"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending.map((u) => (
                          <TableRow key={u._id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              {u.requestedRole ? (
                                <Badge variant={badgeVariantForTone("muted")}>{u.requestedRole}</Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="max-w-48 truncate text-muted-foreground">
                              {u.requestedReason ?? "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {fmtDate(u.createdAt)}
                            </TableCell>
                            <TableCell>
                              <RoleGate capability="users.approve">
                                <div className="flex justify-end gap-1.5">
                                  <Button size="sm" onClick={() => setApproveTarget(u)}>
                                    <UserCheck className="h-4 w-4" /> Approve
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => onReject(u)}>
                                    <UserX className="h-4 w-4 text-destructive" />
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

          <TabsContent value="all">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Directory</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-8 w-32.5" aria-label="Filter by role">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER}>All roles</SelectItem>
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
                      <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
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
                ) : users?.length === 0 ? (
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
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Municipality</TableHead>
                            <TableHead>Wards</TableHead>
                            <TableHead className="w-30"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users?.map((u) => (
                            <TableRow key={u._id}>
                              <TableCell className="font-medium">{u.name}</TableCell>
                              <TableCell className="text-muted-foreground">{u.email}</TableCell>
                              <TableCell>
                                <Badge variant={badgeVariantForTone(ROLE_TONE[u.role] ?? "muted")}>{u.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={badgeVariantForTone(STATUS_TONE[u.status] ?? "muted")}>
                                  {u.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>{u.municipalityName ?? "—"}</TableCell>
                              <TableCell className="max-w-40 truncate text-muted-foreground">
                                {u.wardAssignments?.length ? u.wardAssignments.join(", ") : "all"}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <RoleGate capability="users.assignTenant">
                                    {(u.role === "supervisor" || u.role === "surveyor") && u.status === "active" ? (
                                      <Button size="sm" variant="outline" onClick={() => setAllotmentTarget(u)}>
                                        Allotments
                                      </Button>
                                    ) : null}
                                  </RoleGate>
                                  <RoleGate capability="users.disable">
                                    {u.status !== "disabled" && u.role !== "admin" && (
                                      <Button size="sm" variant="ghost" onClick={() => onDisable(u)}>
                                        <Ban className="h-4 w-4 text-destructive" />
                                      </Button>
                                    )}
                                  </RoleGate>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <TablePagination
                      pageNumber={pageNumber}
                      pageSize={rowsPerPage}
                      itemCount={users?.length ?? 0}
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

        <ApproveUserDialog
          open={!!approveTarget}
          onOpenChange={(o) => !o && setApproveTarget(null)}
          user={approveTarget}
        />
        <UserAllotmentsDialog
          open={!!allotmentTarget}
          onOpenChange={(o) => !o && setAllotmentTarget(null)}
          user={allotmentTarget}
        />
      </div>
    </RoleGate>
  );
}
