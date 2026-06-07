"use client";

import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const modes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[7.5rem] rounded-xl bg-muted/50" aria-hidden />;
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-xl border border-border/70 bg-muted/40 p-0.5 shadow-premium-sm backdrop-blur-sm"
      role="radiogroup"
      aria-label="Theme"
    >
      {modes.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-8 cursor-pointer items-center justify-center rounded-lg px-2.5 transition-all duration-200",
              active
                ? "bg-background text-foreground shadow-premium-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
