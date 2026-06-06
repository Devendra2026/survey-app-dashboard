"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from "@/hooks/masters/useNotifications";
import { USER_ROLE_LABEL, type UserRole } from "@/lib/domain";
import type { Role } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import { fmtDate } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Bell, Check } from "lucide-react";
import { ModeToggle } from "../provider/mode-toggle";

function roleLabel(role: Role | undefined): string {
  if (!role) return "";
  return USER_ROLE_LABEL[role as UserRole] ?? role;
}

export function Topbar() {
  const { user, role } = useCurrentUser();
  const unread = useUnreadCount();
  const notifications = useNotifications(20);
  const markAll = useMarkAllRead();
  const markRead = useMarkRead();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "…"}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {role && <Badge variant="outline">{roleLabel(role)}</Badge>}
          {user?.municipality?.name && <span className="truncate">{user.municipality.name}</span>}
          {user?.district?.name && <span className="truncate">· {user.district.name}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unread > 0 && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => markAll({})}>
                  <Check className="h-3 w-3" /> Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-96 divide-y divide-border overflow-y-auto border-t border-border">
              {notifications === undefined && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
              {notifications?.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No notifications.</div>
              )}
              {notifications?.map((n: any) => (
                <button
                  type="button"
                  key={n._id}
                  onClick={() => !n.readAt && markRead({ id: n._id })}
                  className={`block w-full px-3 py-2.5 text-left hover:bg-accent ${n.readAt ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{fmtDate(n._creationTime)}</p>
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
