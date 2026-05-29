"use client";

import { NAV_VISIBILITY, type Role } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Database,
  FileBarChart,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { key: string; href: string; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "surveys", href: "/surveys", label: "Surveys", icon: ClipboardList },
  { key: "qc", href: "/qc", label: "Quality Control", icon: ShieldCheck },
  { key: "users", href: "/users", label: "Users", icon: Users },
  { key: "masters", href: "/masters", label: "Master Data", icon: Database },
  { key: "reports", href: "/reports", label: "Reports", icon: FileBarChart },
  { key: "audit", href: "/audit", label: "Audit Log", icon: ScrollText },
  { key: "settings", href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useCurrentUser();
  const visible = NAV_VISIBILITY[(role ?? "pending") as Role] ?? [];
  const items = NAV.filter((n) => visible.includes(n.key));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-sidebar-foreground">Property Survey</p>
          <p className="text-[11px] text-muted-foreground">Management Console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 text-[11px] text-muted-foreground">
        <p>Shared Convex backend</p>
        <p className="opacity-70">Web interface • v1.0</p>
      </div>
    </aside>
  );
}
