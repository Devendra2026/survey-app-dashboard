"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useCurrentUser } from "@/lib/session";
import { RedirectToSignIn } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Clock, Loader2, ShieldX } from "lucide-react";

/**
 * Wraps every authenticated page. Three-state gate that mirrors the mobile
 * app's account lifecycle (helpers.requireUser):
 *   - loading            → spinner
 *   - pending_approval   → "awaiting approval" screen (no app access)
 *   - disabled           → "account disabled" screen
 *   - active             → full console
 *
 * Auth itself is enforced by Clerk middleware + Convex JWT validation; this is
 * the domain-status layer on top.
 */
function AccountGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isPending, isDisabled } = useCurrentUser();

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isDisabled) {
    return (
      <StatusScreen
        icon={ShieldX}
        tone="text-destructive"
        title="Account disabled"
        body="This account has been disabled by an administrator. Contact your municipal admin if you believe this is an error."
      />
    );
  }

  if (isPending) {
    return (
      <StatusScreen
        icon={Clock}
        tone="text-warning"
        title="Awaiting approval"
        body={`Your account (${user.email}) is registered and waiting for an administrator to approve it and assign your role and municipality. You'll be notified once approved.`}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-7xl space-y-6 p-5 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function StatusScreen({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: React.ElementType;
  tone: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <Icon className={`mx-auto mb-4 h-10 w-10 ${tone}`} />
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
      <Authenticated>
        <AccountGate>{children}</AccountGate>
      </Authenticated>
    </>
  );
}
