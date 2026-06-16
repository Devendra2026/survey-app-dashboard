"use client";

import { DEMAND_NOTICE_LEGAL_COPY, DEMAND_NOTICE_SHORT_LEGAL } from "@/lib/qc/demand-notice";
import { BilingualLabel, SectionLabel } from "./shared";

export function NoticeLegalBlock() {
  return (
    <section className="dn-section demand-notice-legal-section">
      <SectionLabel>
        <BilingualLabel en="Important Notice" hi="महत्वपूर्ण सूचना" />
      </SectionLabel>
      <div className="demand-notice-screen-legal rounded-lg border-2 border-[var(--dn-accent)]/30 bg-[var(--dn-surface)] p-[var(--dn-space-4)] text-sm leading-relaxed text-[var(--dn-primary)]">
        <p>{DEMAND_NOTICE_SHORT_LEGAL.english}</p>
        <p className="demand-notice-hi mt-2 text-[var(--dn-secondary)]">{DEMAND_NOTICE_SHORT_LEGAL.hindi}</p>
      </div>
      <div className="demand-notice-print-legal">
        <div className="demand-notice-legal-box overflow-hidden bg-white">
          <div className="demand-notice-legal-text">
            <p className="demand-notice-hi">{DEMAND_NOTICE_LEGAL_COPY.hindi}</p>
            <p className="demand-notice-hi mt-1.5 font-semibold">{DEMAND_NOTICE_LEGAL_COPY.hindiNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
