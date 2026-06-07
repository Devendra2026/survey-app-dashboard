"use client";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function SidebarCollapseButton({ className }: { className?: string }) {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      className={cn(
        "relative shrink-0 cursor-pointer overflow-hidden rounded-xl transition-colors duration-200",
        className,
      )}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
    >
      <PanelLeftClose
        className={cn(
          "absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
        aria-hidden
      />
      <PanelLeftOpen
        className={cn(
          "absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0",
        )}
        aria-hidden
      />
    </Button>
  );
}
