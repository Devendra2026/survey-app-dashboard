"use client";

import { ExecutiveHero } from "@/components/design-system/executive-hero";
import { ScrollText } from "lucide-react";

export function DemandNoticePanelHero() {
  return (
    <ExecutiveHero
      eyebrow="Reports"
      title="Demand Notice Panel"
      description="Generate filtered demand registers and open printable property notices."
      icon={ScrollText}
      gradient="red"
    />
  );
}
