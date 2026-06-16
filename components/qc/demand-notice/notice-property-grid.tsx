"use client";

import { Badge } from "@/components/ui/badge";
import { formatAmountPlain, formatOwnerDisplay, type DemandNoticeData } from "@/lib/qc/demand-notice";
import type { SurveyDetail } from "@/schema/surveys/index";
import { Hash, Home, IndianRupee, MapPin, Phone, User } from "lucide-react";
import { BilingualLabel, NoticeDataCard, rateSourceCaption } from "./shared";

export function NoticePropertyGrid({
  survey,
  propertyId,
  ownerName,
  fatherName,
  mobileNo,
  oldHouseNo,
  taxZone,
  address,
  notice,
}: {
  survey: SurveyDetail;
  propertyId: string;
  ownerName: string;
  fatherName: string;
  mobileNo: string;
  oldHouseNo: string;
  taxZone: string;
  address: string;
  notice: DemandNoticeData;
}) {
  const ownerDisplay = formatOwnerDisplay(ownerName, fatherName);
  const annualRate = notice.masterBaseRate ? `₹${formatAmountPlain(notice.masterBaseRate.annualRate)}/sqft/yr` : "—";

  return (
    <section className="dn-section demand-notice-property-section">
      <div className="demand-notice-property-grid dn-grid-12 gap-[var(--dn-space-2)]">
        <NoticeDataCard
          className="col-span-12 sm:col-span-6 lg:col-span-4"
          icon={User}
          label={<BilingualLabel en="Owner" hi="मालिक" />}
          value={ownerDisplay}
        />
        <NoticeDataCard
          className="col-span-12 sm:col-span-6 lg:col-span-4"
          icon={Phone}
          label={<BilingualLabel en="Mobile" hi="मोबाइल" />}
          value={mobileNo}
        />
        <NoticeDataCard
          className="col-span-12 sm:col-span-6 lg:col-span-4"
          label={<BilingualLabel en="Ward" hi="वार्ड" />}
          value={`Ward ${survey.wardNo}`}
        />
        <NoticeDataCard
          className="col-span-12 sm:col-span-6 lg:col-span-4"
          icon={Hash}
          label={<BilingualLabel en="Property ID" hi="संपत्ति आईडी" />}
          value={propertyId}
        />
        <NoticeDataCard
          className="col-span-12 sm:col-span-6 lg:col-span-4"
          icon={MapPin}
          label={<BilingualLabel en="Road Width Zone" hi="सड़क चौड़ाई क्षेत्र" />}
          value={taxZone}
        />
        <NoticeDataCard
          className="col-span-12 sm:col-span-6 lg:col-span-4"
          icon={IndianRupee}
          label={<BilingualLabel en="Annual Base Rate" hi="वार्षिक आधार दर" />}
          value={annualRate}
        />
        <NoticeDataCard
          className="col-span-12 sm:col-span-6 lg:col-span-4"
          icon={Home}
          label={<BilingualLabel en="Old House No." hi="पुराना मकान नंबर" />}
          value={oldHouseNo}
        />
        <NoticeDataCard
          className="col-span-12 demand-notice-address-row"
          icon={MapPin}
          label={<BilingualLabel en="Property Address" hi="संपत्ति का पता" />}
          value={address || "—"}
        />
      </div>
      {notice.masterBaseRate && notice.rateSource !== "system" && (
        <p className="demand-notice-print-hide mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            Master data
          </Badge>
          {rateSourceCaption(notice)}
        </p>
      )}
    </section>
  );
}
