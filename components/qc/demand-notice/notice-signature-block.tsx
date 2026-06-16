"use client";

export function NoticeSignatureBlock() {
  return (
    <section className="dn-section demand-notice-print-only">
      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-none border border-black">
        <div className="p-3 print:p-2">
          <div className="mb-1 text-right font-serif text-sm text-slate-700" aria-hidden>
            Sd/-
          </div>
          <div className="demand-notice-signature-pad min-h-10.5 border-b border-black/20" aria-hidden />
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-(--dn-secondary)">Executive Officer</p>
          <p className="demand-notice-hi text-[10px] font-semibold">अधिशासी अधिकारी</p>
        </div>
      </div>
    </section>
  );
}

export function NoticeSignatureBlockScreen() {
  return (
    <section className="dn-section demand-notice-print-hide">
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg border border-(--dn-border) bg-white p-4 text-center">
          <div className="mb-1 text-right font-serif text-sm text-slate-600" aria-hidden>
            Sd/-
          </div>
          <div className="mb-3 h-12 border-b border-(--dn-border)" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-wider text-(--dn-secondary)">Executive Officer</p>
          <p className="demand-notice-hi text-[11px] font-semibold">अधिशासी अधिकारी</p>
        </div>
      </div>
    </section>
  );
}
