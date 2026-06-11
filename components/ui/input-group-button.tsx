"use client";

import { type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { inputGroupButtonVariants } from "@/components/ui/input-group-button-variants";
import { cn } from "@/lib/utils";

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> & VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

export { InputGroupButton };
