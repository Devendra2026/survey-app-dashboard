"use client";

import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { inputGroupAddonVariants } from "@/components/ui/input-group-addon-variants";
import { useInputGroupControlId } from "@/components/ui/input-group-context";
import { cn } from "@/lib/utils";

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"label"> & VariantProps<typeof inputGroupAddonVariants>) {
  const controlId = useInputGroupControlId();

  return (
    <label
      htmlFor={controlId}
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  );
}

export { InputGroupAddon };
