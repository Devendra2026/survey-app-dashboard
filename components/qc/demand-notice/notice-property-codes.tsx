"use client";

import { buildQrPayload } from "@/lib/qc/demand-notice-codes";
import { QRCodeSVG } from "qrcode.react";

export function NoticePropertyCodes({ propertyId }: { propertyId: string }) {
  const qrValue = buildQrPayload(propertyId);

  return (
    <section className="dn-section demand-notice-codes border-t border-[var(--dn-border)] pt-[var(--dn-space-3)]">
      <div className="flex flex-col items-center gap-1 print:flex-row print:items-center print:justify-center print:gap-2">
        <QRCodeSVG
          value={qrValue}
          size={72}
          level="M"
          className="demand-notice-qr h-[72px] w-[72px] print:h-[56px] print:w-[56px]"
          aria-label={`QR code for property ${propertyId}`}
        />
        <div className="text-center print:text-left">
          <p className="text-[9px] font-medium uppercase tracking-wide text-[var(--dn-secondary)] print:text-[5px]">
            Scan to verify
          </p>
          <p className="font-mono text-[10px] font-semibold text-[var(--dn-primary)] print:text-[6px]">{propertyId}</p>
        </div>
      </div>
    </section>
  );
}
