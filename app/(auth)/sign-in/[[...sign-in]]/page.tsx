import { clerkAppearance } from "@/lib/clerk-appearance";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      appearance={clerkAppearance}
      forceRedirectUrl="/dashboard"
      signUpUrl="/sign-up"
    />
  );
}
