"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const iconTransition =
  "transition-all duration-300 motion-reduce:transition-none motion-reduce:rotate-0 motion-reduce:scale-100";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="size-8 shrink-0 rounded-xl bg-muted/50" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative cursor-pointer rounded-xl"
          aria-label={label}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          <Sun className={cn(iconTransition, "rotate-0 scale-100 dark:-rotate-90 dark:scale-0")} aria-hidden />
          <Moon className={cn(iconTransition, "absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100")} aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
