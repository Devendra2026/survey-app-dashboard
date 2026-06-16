"use client";

import { useCallback, useEffect } from "react";

/** Printable A4 height at 96dpi minus 16mm margins (297mm − 16mm). */
const PRINTABLE_HEIGHT_PX = 1062;
const MIN_SCALE = 0.55;

const SCALER_SELECTOR = ".demand-notice-print-scaler";

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function fitDemandNoticeDocument() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForLayout();

  const scaler = document.querySelector<HTMLElement>(SCALER_SELECTOR);
  if (!scaler) return;

  scaler.style.removeProperty("--dn-scale");

  const naturalHeight = scaler.scrollHeight;
  if (naturalHeight <= PRINTABLE_HEIGHT_PX) return;

  let scale = Math.max(MIN_SCALE, PRINTABLE_HEIGHT_PX / naturalHeight);

  while (scale > MIN_SCALE && naturalHeight * scale > PRINTABLE_HEIGHT_PX) {
    scale = Math.max(MIN_SCALE, scale - 0.02);
  }

  scaler.style.setProperty("--dn-scale", String(Math.floor(scale * 100) / 100));
}

function resetDemandNoticeDocument() {
  const scaler = document.querySelector<HTMLElement>(SCALER_SELECTOR);
  if (!scaler) return;
  scaler.style.removeProperty("--dn-scale");
}

/** Scales the demand notice to fit one A4 page when printing. */
export function useDemandNoticePrintFit() {
  useEffect(() => {
    const onBeforePrint = () => {
      void fitDemandNoticeDocument();
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", resetDemandNoticeDocument);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", resetDemandNoticeDocument);
    };
  }, []);

  const printNotice = useCallback(() => {
    void (async () => {
      await fitDemandNoticeDocument();
      requestAnimationFrame(() => window.print());
    })();
  }, []);

  return { printNotice };
}
