"use client";

import { MapPin } from "lucide-react";
import { BilingualLabel } from "./bilingual-label";
import { NoticeDataCard } from "./notice-data-card";

export function NoticeAddressCard({ address }: { address: string }) {
  return (
    <section className="dn-section demand-notice-address-section">
      <NoticeDataCard
        className="col-span-12"
        icon={MapPin}
        label={<BilingualLabel en="Property Address" hi="संपत्ति का पता" />}
        value={address || "—"}
      />
    </section>
  );
}
