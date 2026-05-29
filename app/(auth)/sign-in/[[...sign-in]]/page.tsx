import { SignIn } from "@clerk/nextjs";
import { ClipboardList } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Property Survey Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Municipal property survey management. Sign in with your authorized account.
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn />
        </div>
      </div>
    </div>
  );
}
