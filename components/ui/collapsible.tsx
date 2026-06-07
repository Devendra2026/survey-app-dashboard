"use client";

import { Collapsible as CollapsiblePrimitive } from "radix-ui";

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

export { CollapsibleContent } from "@/components/ui/collapsible-content";
export { CollapsibleTrigger } from "@/components/ui/collapsible-trigger";
export { Collapsible };
