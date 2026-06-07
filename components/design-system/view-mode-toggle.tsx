"use client";

import { cn } from "@/lib/utils";
import { CalendarDays, LayoutGrid, Map, Table2 } from "lucide-react";

export type ViewMode = "table" | "calendar" | "gis";

const modes: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: "table", label: "Table", icon: Table2 },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "gis", label: "GIS", icon: Map },
];

export function ViewModeToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex rounded-xl border border-border/60 bg-muted/30 p-1 backdrop-blur-sm", className)}
      role="tablist"
      aria-label="View mode"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BulkActionBar({
  selectedCount,
  onClear,
  actions,
  className,
}: {
  selectedCount: number;
  onClear: () => void;
  actions?: React.ReactNode;
  className?: string;
}) {
  if (selectedCount === 0) return null;
  return (
    <output
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 backdrop-blur-sm",
        className,
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm">
        <LayoutGrid className="h-4 w-4 text-primary" aria-hidden />
        <span className="font-medium">{selectedCount} selected</span>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Clear
        </button>
      </div>
      {actions}
    </output>
  );
}
