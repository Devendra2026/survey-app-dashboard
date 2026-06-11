"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

/** Amber-themed shell — visually distinct from the Surveys (navy) module. */
export default function QcPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inPortal = pathname === "/qc" || pathname.startsWith("/qc/");

  if (!inPortal) return <>{children}</>;

  return (
    <div
      className={cn(
        "qc-portal -mx-4 -mt-2 min-h-full space-y-0 rounded-none sm:-mx-5 lg:-mx-8",
        "border-t-4 border-amber-500/80 bg-linear-to-b from-amber-500/6 via-transparent to-transparent",
        "dark:border-amber-400/70 dark:from-amber-500/10",
      )}
      data-module="qc"
    >
      <div className="mx-auto w-full max-w-360 space-y-6 px-4 pt-4 pb-2 sm:px-5 lg:space-y-8 lg:px-8 lg:pt-6">
        {children}
      </div>
    </div>
  );
}
