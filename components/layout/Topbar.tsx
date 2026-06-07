"use client";

import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarCollapseButton } from "@/components/layout/sidebar-collapse-button";
import { useSidebar } from "@/components/layout/sidebar-context";
import { TopbarUser } from "@/components/layout/topbar-user";
import { ModeToggle } from "@/components/provider/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from "@/hooks/masters/useNotifications";
import { fmtDate } from "@/lib/utils";
import { Bell, Check, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function Topbar() {
  const { toggleMobile } = useSidebar();
  const router = useRouter();
  const unread = useUnreadCount();
  const notifications = useNotifications(20);
  const markAll = useMarkAllRead();
  const markRead = useMarkRead();
  const [search, setSearch] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = search.trim();
      if (q) router.push(`/surveys?search=${encodeURIComponent(q)}`);
    },
    [search, router],
  );

  return (
    <>
      <CommandPalette />
      <header className="glass-surface z-10 flex h-14 shrink-0 items-center gap-3 px-3 sm:px-5 lg:h-17">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl lg:hidden"
          onClick={toggleMobile}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <SidebarCollapseButton className="hidden lg:inline-flex" />

        <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 sm:block sm:max-w-lg" role="search">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys, parcels, wards…"
            className="h-10 cursor-text rounded-xl border-border/70 bg-background/70 pl-10 pr-16 shadow-premium-sm backdrop-blur-sm transition-shadow duration-200 focus-visible:shadow-premium-md"
            aria-label="Global search"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative cursor-pointer rounded-xl"
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white shadow-glow-red">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl border-border/80 p-0 shadow-premium-lg">
              <div className="flex items-center justify-between px-4 py-3">
                <DropdownMenuLabel className="p-0 font-semibold">Notifications</DropdownMenuLabel>
                {unread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 cursor-pointer gap-1 text-xs"
                    onClick={() => markAll({})}
                  >
                    <Check className="h-3 w-3" aria-hidden /> Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-96 divide-y divide-border overflow-y-auto border-t border-border premium-scrollbar">
                {notifications === undefined && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
                {notifications?.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No notifications.</div>
                )}
                {notifications?.map((n: any) => (
                  <button
                    type="button"
                    key={n._id}
                    onClick={() => !n.readAt && markRead({ id: n._id })}
                    className={`block w-full cursor-pointer px-4 py-3 text-left transition-colors duration-200 hover:bg-muted/50 ${n.readAt ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-red" aria-hidden />}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">{fmtDate(n._creationTime)}</p>
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />
          <TopbarUser />
        </div>
      </header>
    </>
  );
}
