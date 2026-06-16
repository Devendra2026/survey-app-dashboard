"use client";

import { Input } from "@/components/ui/input";
import { useInputGroupControlId } from "@/components/ui/input-group-context";
import { cn } from "@/lib/utils";

function InputGroupInput({ className, id, ...props }: React.ComponentProps<"input">) {
  const controlId = useInputGroupControlId();

  return (
    <Input
      id={id ?? controlId}
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroupInput };
