"use client";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navKeysForUser, type Role } from "@/lib/permissions";
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
  ShieldEllipsis,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { key: string; href: string; label: string; icon: React.ElementType };

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Operations",
    items: [
      { key: "surveys", href: "/surveys", label: "Surveys", icon: ClipboardList },
      { key: "qc", href: "/qc", label: "Quality Control", icon: ShieldCheck },
      { key: "reports", href: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    title: "Administration",
    items: [
      { key: "users", href: "/users", label: "Users", icon: Users },
      { key: "roles", href: "/roles", label: "Roles", icon: ShieldEllipsis },
      { key: "masters", href: "/masters", label: "Master Data", icon: Database },
      { key: "audit", href: "/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
  {
    title: "System",
    items: [{ key: "settings", href: "/settings", label: "Settings", icon: Settings }],
  },
];

const labelTransition = "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors duration-200",
        collapsed ? "justify-center px-2" : "px-3",
        active
          ? "bg-brand-red/10 text-sidebar-foreground dark:bg-brand-red/15"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      {active && (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-brand-red",
            labelTransition,
            collapsed && "opacity-0",
          )}
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "h-4.5 w-4.5 shrink-0 transition-colors duration-200",
          active ? "text-brand-red" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "truncate whitespace-nowrap",
          labelTransition,
          collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100",
        )}
      >
        {item.label}
      </span>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function NavItems({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, capabilities } = useCurrentUser();
  const visible = navKeysForUser(capabilities, (role ?? "pending") as Role);

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => visible.includes(item.key)),
  })).filter((section) => section.items.length > 0);

  return (
    <nav
      className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-2 py-3 premium-scrollbar"
      aria-label="Main navigation"
    >
      {sections.map((section) => (
        <div key={section.title}>
          <p
            className={cn(
              "mb-1.5 overflow-hidden px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40",
              labelTransition,
              collapsed ? "max-h-0 opacity-0" : "max-h-6 opacity-100",
            )}
          >
            {section.title}
          </p>
          <ul className="space-y-0.5" role="list">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.key}>
                  <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex h-17 shrink-0 items-center justify-center overflow-hidden border-b border-sidebar-border px-2">
      <Link
        href="/dashboard"
        className="flex cursor-pointer items-center justify-center rounded-xl p-1.5 transition-opacity duration-200 hover:opacity-90"
        aria-label="Home"
      >
        <Image
          src="/sdv-logo.png"
          alt="SDV"
          width={132}
          height={40}
          style={{ width: "auto", height: "auto" }}
          className={cn(
            "object-contain transition-all duration-300 ease-in-out",
            collapsed ? "h-10 w-10" : "h-10 w-auto max-w-24",
          )}
          priority
        />
      </Link>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "sidebar-shell relative hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-sidebar-border lg:flex",
          "bg-sidebar backdrop-blur-xl shadow-premium-sm dark:shadow-none",
          collapsed ? "w-17" : "w-62",
        )}
        aria-label="Sidebar"
        data-collapsed={collapsed}
      >
        <SidebarBrand collapsed={collapsed} />
        <NavItems collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-48 border-sidebar-border bg-sidebar p-0 backdrop-blur-xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Main application navigation links.</SheetDescription>
          </SheetHeader>
          <SidebarBrand />
          <NavItems onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
