"use client";

import { MapPin } from "lucide-react";
import { BilingualLabel, NoticeDataCard } from "./shared";

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
