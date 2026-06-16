"use client";

export function NoticeSignatureBlock() {
  return (
    <section className="dn-section demand-notice-print-only">
      <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-none border border-black">
        <div className="border-r border-black p-3 print:p-2">
          <div className="demand-notice-signature-pad min-h-[48px] border-b border-black/20" aria-hidden />
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-[var(--dn-secondary)]">
            Executive Officer
          </p>
          <p className="demand-notice-hi text-[10px] font-semibold">अधिशासी अधिकारी</p>
        </div>
        <div className="p-3 print:p-2">
          <div className="demand-notice-signature-pad min-h-[48px] border-b border-black/20" aria-hidden />
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-[var(--dn-secondary)]">Tax Collector</p>
          <p className="demand-notice-hi text-[10px] font-semibold">टैक्स कलेक्टर</p>
        </div>
      </div>
    </section>
  );
}

export function NoticeSignatureBlockScreen() {
  return (
    <section className="dn-section demand-notice-print-hide">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--dn-border)] bg-white p-4 text-center">
          <div className="mb-3 h-12 border-b border-[var(--dn-border)]" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--dn-secondary)]">Executive Officer</p>
          <p className="demand-notice-hi text-[11px] font-semibold">अधिशासी अधिकारी</p>
        </div>
        <div className="rounded-lg border border-[var(--dn-border)] bg-white p-4 text-center">
          <div className="mb-3 h-12 border-b border-[var(--dn-border)]" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--dn-secondary)]">Tax Collector</p>
          <p className="demand-notice-hi text-[11px] font-semibold">टैक्स कलेक्टर</p>
        </div>
      </div>
    </section>
  );
}
