"use client";

import { useInputGroupControlId } from "@/components/ui/input-group-context";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function InputGroupTextarea({ className, id, ...props }: React.ComponentProps<"textarea">) {
  const controlId = useInputGroupControlId();

  return (
    <Textarea
      id={id ?? controlId}
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroupTextarea };
