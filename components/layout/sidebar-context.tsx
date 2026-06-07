"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (v: boolean) => void;
  toggleMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sdv-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sdv-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);

  const value = useMemo(
    () => ({
      collapsed,
      mobileOpen,
      setCollapsed,
      toggleCollapsed,
      setMobileOpen,
      toggleMobile,
    }),
    [collapsed, mobileOpen, toggleCollapsed, toggleMobile],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
