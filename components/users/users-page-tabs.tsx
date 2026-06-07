"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SheetUser } from "@/components/users/user-edit-sheet";
import { AllUsersDirectoryTab } from "@/components/users/users-directory-tab";
import {
  type AllotUser,
  type ListedUser,
  type PendingUser,
  type RoleRow,
  type UsersListUiAction,
  type UsersListUiState,
} from "@/components/users/users-page-shared";
import { PendingApprovalsTab } from "@/components/users/users-pending-tab";
import { cn } from "@/lib/utils";
import { Ban, CheckCircle2, Clock, Users } from "lucide-react";
import type { Dispatch } from "react";

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

export function UsersPageKpiStrip({
  pending,
  users,
  activeCount,
  disabledCount,
}: {
  pending: PendingUser[] | undefined;
  users: ListedUser[] | undefined;
  activeCount: number;
  disabledCount: number;
}) {
  return (
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
  );
}

export function UsersPageTabs({
  pending,
  users,
  filteredUsers,
  allRoles,
  listUi,
  dispatchListUi,
  hasFilters,
  clearFilters,
  isLoading,
  pageNumber,
  rowsPerPage,
  canGoPrev,
  canGoNext,
  goPrev,
  goNext,
  setSheetUser,
  setAllotUser,
}: {
  pending: PendingUser[] | undefined;
  users: ListedUser[] | undefined;
  filteredUsers: ListedUser[] | undefined;
  allRoles: RoleRow[] | undefined;
  listUi: UsersListUiState;
  dispatchListUi: Dispatch<UsersListUiAction>;
  hasFilters: boolean;
  clearFilters: () => void;
  isLoading: boolean;
  pageNumber: number;
  rowsPerPage: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  setSheetUser: (user: SheetUser) => void;
  setAllotUser: (user: AllotUser) => void;
}) {
  return (
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
          {users?.length ? <span className="ml-2 text-[11px] text-muted-foreground">{users.length}</span> : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-4">
        <PendingApprovalsTab pending={pending} setSheetUser={setSheetUser} />
      </TabsContent>

      <TabsContent value="all" className="mt-4">
        <AllUsersDirectoryTab
          filteredUsers={filteredUsers}
          allRoles={allRoles}
          listUi={listUi}
          dispatchListUi={dispatchListUi}
          hasFilters={hasFilters}
          clearFilters={clearFilters}
          isLoading={isLoading}
          pageNumber={pageNumber}
          rowsPerPage={rowsPerPage}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          goPrev={goPrev}
          goNext={goNext}
          setSheetUser={setSheetUser}
          setAllotUser={setAllotUser}
        />
      </TabsContent>
    </Tabs>
  );
}
