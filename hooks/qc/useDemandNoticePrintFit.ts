"use client";

import { useCallback, useEffect } from "react";

/** Printable A4 height at 96dpi minus 16mm margins (297mm − 16mm). */
const PRINTABLE_HEIGHT_PX = 1062;
const MIN_SCALE = 0.55;

const SCALER_SELECTOR = ".demand-notice-print-scaler";
const SCREEN_LAYOUT_SELECTOR = '[data-dn-layout="screen"]';
const PRINT_LAYOUT_SELECTOR = '[data-dn-layout="print"]';
const PRINT_MEASURE_CLASS = "dn-print-measure";

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

  const html = document.documentElement;
  const screenLayout = document.querySelector<HTMLElement>(SCREEN_LAYOUT_SELECTOR);
  const printLayout = document.querySelector<HTMLElement>(PRINT_LAYOUT_SELECTOR);

  try {
    html.classList.add(PRINT_MEASURE_CLASS);
    if (screenLayout) {
      screenLayout.dataset.dnMeasureRestoreDisplay = screenLayout.style.display;
      screenLayout.style.display = "none";
    }
    if (printLayout) {
      printLayout.dataset.dnMeasureRestoreDisplay = printLayout.style.display;
      printLayout.style.display = "block";
    }

    await waitForLayout();

    scaler.style.removeProperty("--dn-scale");

    const naturalHeight = scaler.scrollHeight;
    let scale = 1;
    if (naturalHeight > PRINTABLE_HEIGHT_PX) {
      scale = Math.max(MIN_SCALE, PRINTABLE_HEIGHT_PX / naturalHeight);
      while (scale > MIN_SCALE && naturalHeight * scale > PRINTABLE_HEIGHT_PX) {
        scale = Math.max(MIN_SCALE, scale - 0.02);
      }
    }

    if (scale < 1) {
      scaler.style.setProperty("--dn-scale", String(Math.floor(scale * 100) / 100));
    } else {
      scaler.style.removeProperty("--dn-scale");
    }
  } finally {
    if (screenLayout) {
      screenLayout.style.display = screenLayout.dataset.dnMeasureRestoreDisplay ?? "";
      delete screenLayout.dataset.dnMeasureRestoreDisplay;
    }
    if (printLayout) {
      printLayout.style.display = printLayout.dataset.dnMeasureRestoreDisplay ?? "";
      delete printLayout.dataset.dnMeasureRestoreDisplay;
    }
    html.classList.remove(PRINT_MEASURE_CLASS);
  }
}

function resetDemandNoticeDocument() {
  const scaler = document.querySelector<HTMLElement>(SCALER_SELECTOR);
  if (scaler) {
    scaler.style.removeProperty("--dn-scale");
  }
  document.documentElement.classList.remove(PRINT_MEASURE_CLASS);
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
