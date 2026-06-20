"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

/** Indigo-themed shell — visually distinct from the QC (amber) module. */
export default function SurveyPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inPortal = pathname === "/surveys" || pathname.startsWith("/surveys/");

  if (!inPortal) return <>{children}</>;

  return (
    <div
      className={cn(
        "survey-portal font-display -mx-4 -mt-2 min-h-full space-y-0 rounded-none sm:-mx-5 lg:-mx-8",
        "border-t-4 border-indigo-500/80 bg-[#F5F3FF] dark:bg-background",
        "bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.04),transparent_55%)]",
        "dark:border-indigo-400/70 dark:bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12),transparent_50%)]",
      )}
      data-module="surveys"
    >
      <div className="mx-auto w-full max-w-360 space-y-6 px-4 pt-4 pb-2 sm:px-5 lg:space-y-8 lg:px-8 lg:pt-6">
        {children}
      </div>
    </div>
  );
}
