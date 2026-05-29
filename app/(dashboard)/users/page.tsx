"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { ApproveUserDialog } from "@/features/users/components/approve-user-dialog";
import { useDisableUser, usePendingApprovals, useRejectUser, useUserList } from "@/features/users/hooks/useUsers";
import { parseConvexError } from "@/lib/errors";
import { fmtDate } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { FunctionReturnType } from "convex/server";
import { Ban, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type BadgeTone = "default" | "success" | "muted" | "warning" | "destructive";
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
type PendingUser = FunctionReturnType<typeof api.admin.listPendingApprovals>[number];
type ListedUser = FunctionReturnType<typeof api.admin.listUsers>[number];

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

export default function UsersPage() {
  const pending = usePendingApprovals();
  const users = useUserList();
  const reject = useRejectUser();
  const disable = useDisableUser();
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null);

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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead></TableHead>
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
                              <div className="flex gap-1.5">
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardContent className="pt-5">
                {users === undefined ? (
                  <TableSkeleton rows={6} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Municipality</TableHead>
                        <TableHead>Wards</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={badgeVariantForTone(ROLE_TONE[u.role] ?? "muted")}>{u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={badgeVariantForTone(STATUS_TONE[u.status] ?? "muted")}>
                              {u.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.municipalityName ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.wardAssignments?.length ? u.wardAssignments.join(", ") : "all"}
                          </TableCell>
                          <TableCell>
                            <RoleGate capability="users.disable">
                              {u.status !== "disabled" && u.role !== "admin" && (
                                <Button size="sm" variant="ghost" onClick={() => onDisable(u)}>
                                  <Ban className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </RoleGate>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
      </div>
    </RoleGate>
  );
}
