"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading";
import { TablePagination } from "@/components/shared/table-pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ALL,
  avatarColor,
  initials,
  isFieldRole,
  ROLE_COLORS,
  ROLE_DOT,
  STATUS_COLORS,
  toListedSheet,
  usersListHasActiveFilters,
  type UsersDirectoryTabModel,
} from "@/components/users/users-page-shared";
import type { Id } from "@/convex/_generated/dataModel";
import { cn, fmtDate } from "@/lib/utils";
import { Building2, Layers, MapPin, Search, SlidersHorizontal, UserCheck, X } from "lucide-react";

export function AllUsersDirectoryTab({
  filteredUsers,
  allRoles,
  listUi,
  dispatchListUi,
  pagination,
  loadStatus,
  setSheetUser,
  setAllotUser,
}: UsersDirectoryTabModel) {
  const { roleFilter, statusFilter, search } = listUi;
  const { pageNumber, rowsPerPage, canGoPrev, canGoNext, goPrev, goNext } = pagination;
  const hasActiveFilters = usersListHasActiveFilters(listUi);

  return (
    <div>
      <div className="border-b border-border/60 bg-muted/15 px-5 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => dispatchListUi({ type: "setSearch", value: e.target.value })}
              placeholder="Search name or email…"
              className="h-8 w-52 pl-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={roleFilter} onValueChange={(value) => dispatchListUi({ type: "setRoleFilter", value })}>
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
            <Select value={statusFilter} onValueChange={(value) => dispatchListUi({ type: "setStatusFilter", value })}>
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
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => dispatchListUi({ type: "clearFilters" })}
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {loadStatus === "loading" ? (
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
                <TableHead className="w-20 pr-5 text-right font-semibold text-foreground">Actions</TableHead>
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
              onPageSizeChange={(value) => dispatchListUi({ type: "setPageSize", value })}
            />
          </div>
        </>
      )}
    </div>
  );
}
