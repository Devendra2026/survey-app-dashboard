"use client";

export function NoticePropertyCodes({ propertyId }: { propertyId: string }) {
  return (
    <section className="dn-section demand-notice-codes border-t border-(--dn-border) pt-(--dn-space-3)">
      <div className="text-center">
        <p className="text-[9px] font-medium uppercase tracking-wide text-(--dn-secondary) print:text-[5px]">
          Property Reference
        </p>
        <p className="font-mono text-[10px] font-semibold text-(--dn-primary) print:text-[6px]">{propertyId}</p>
      </div>
    </section>
  );
}
