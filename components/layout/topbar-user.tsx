"use client";

import { Badge } from "@/components/ui/badge";
import { USER_ROLE_LABEL, type UserRole } from "@/lib/domain";
import type { Role } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

function roleLabel(role: Role | undefined): string {
  if (!role) return "";
  return USER_ROLE_LABEL[role as UserRole] ?? role;
}

export function TopbarUser() {
  const { user, role } = useCurrentUser();

  return (
    <div
      className={cn(
        "flex cursor-default items-center gap-2 rounded-xl border border-border/70 bg-muted/30 py-1 pl-1 pr-3 shadow-premium-sm",
        "transition-colors duration-200 hover:border-brand-navy/15 hover:bg-muted/50 dark:hover:border-brand-red/20",
      )}
    >
      <UserButton
        appearance={{
          elements: {
            rootBox: "flex shrink-0",
            userButtonBox: "flex",
            userButtonTrigger:
              "h-9 w-9 rounded-lg border border-border/50 shadow-none focus:shadow-none hover:opacity-90 transition-opacity",
            userButtonPopoverCard: "rounded-2xl shadow-premium-lg",
          },
        }}
      />
      <div className="hidden min-w-0 text-left sm:block">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">{user?.name ?? "…"}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {role && (
            <Badge variant="outline" className="h-4 border-brand-navy/15 px-1.5 text-[10px] dark:border-brand-red/20">
              {roleLabel(role)}
            </Badge>
          )}
          {user?.municipality?.name && <span className="truncate">{user.municipality.name}</span>}
          {user?.district?.name && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{user.district.name}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
