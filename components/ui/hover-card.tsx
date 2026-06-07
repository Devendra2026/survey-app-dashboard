"use client";

import { HoverCard as HoverCardPrimitive } from "radix-ui";

function HoverCard({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

export { HoverCardContent } from "@/components/ui/hover-card-content";
export { HoverCardTrigger } from "@/components/ui/hover-card-trigger";
export { HoverCard };
