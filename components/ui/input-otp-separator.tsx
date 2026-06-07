"use client";

function InputOTPSeparator({ ...props }: React.ComponentProps<"hr">) {
  return <hr data-slot="input-otp-separator" className="mx-1 flex h-4 w-px shrink-0 border-0 bg-border" {...props} />;
}

export { InputOTPSeparator };
