"use client";

import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { inputGroupAddonVariants } from "@/components/ui/input-group-addon-variants";
import { cn } from "@/lib/utils";

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

export { InputGroupAddon };
