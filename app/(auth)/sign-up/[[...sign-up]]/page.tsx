import { clerkAppearance } from "@/lib/clerk-appearance";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={clerkAppearance}
      forceRedirectUrl="/dashboard"
      signInUrl="/sign-in"
    />
  );
}
