"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useCurrentUser } from "@/lib/session";
import { useAuth } from "@clerk/nextjs";
import { Authenticated, AuthLoading } from "convex/react";
import { Clock, Loader2, ShieldX } from "lucide-react";

function AccountGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isPending, isDisabled } = useCurrentUser();

  if (isLoading || !user) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
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
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-background">
          <div className="mx-auto w-full max-w-7xl space-y-6 p-5 pb-10 lg:p-8 lg:pb-12">{children}</div>
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
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4">
      <div className="max-w-md text-center">
        <Icon className={`mx-auto mb-4 h-10 w-10 ${tone}`} />
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function AuthSpinner() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return <AuthSpinner />;
  }

  return (
    <>
      <AuthLoading>
        <AuthSpinner />
      </AuthLoading>
      <Authenticated>
        <AccountGate>{children}</AccountGate>
      </Authenticated>
    </>
  );
}
