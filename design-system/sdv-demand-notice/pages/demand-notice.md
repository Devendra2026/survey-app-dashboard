# Premium A4 Demand Notice — Design Spec

> Government-grade property tax demand notice · WYSIWYG screen + print

---

## Sheet

| Property        | Value                                               |
| --------------- | --------------------------------------------------- |
| Page size       | A4 portrait (210mm × 297mm)                         |
| Printable width | 198mm (6mm margins)                                 |
| Root classes    | `.demand-notice-document`, `.demand-notice-sheet`   |
| Single page     | Auto-scale via `useDemandNoticePrintFit` (min 0.65) |

---

## Section order

1. **NoticeHeader** — logo, office titles, year, date, property ID
2. **NoticePropertyGrid** — owner, mobile, ward, ID, zone, rate, house no.
3. **NoticeAddressCard** — full-width address
4. **NoticePhotoGallery** — front, side, GPS/map
5. **NoticeDemandSummary** — tax breakdown + total highlight
6. **NoticeAssessmentTable** — 6-col zebra table
7. **NoticeLegalBlock** — short EN/HI screen; full Hindi on print
8. **NoticeSignatureBlock** — EO + Tax Collector (dual column on print)
9. **NoticePropertyCodes** — QR + Code128 barcode
10. **NoticeWatermark** — ULB name, ~6% opacity

---

## Tokens (`--dn-*`)

Primary `#0F172A` · Secondary `#334155` · Accent `#0369A1` · Summary `#EEF2FF` · Zebra `#F8FAFC` · Border `#E2E8F0`

Spacing: 4 / 8 / 12 / 16 / 24 / 32px (`--dn-space-1` … `--dn-space-6`)

Typography: EB Garamond (titles), Lato (body), Noto Sans Devanagari (Hindi)

---

## Module layout

```
components/qc/demand-notice/
  document.tsx          — composer
  notice-header.tsx
  notice-property-grid.tsx
  notice-address-card.tsx
  notice-photo-gallery.tsx
  notice-demand-summary.tsx
  notice-assessment-table.tsx
  notice-legal-block.tsx
  notice-signature-block.tsx
  notice-property-codes.tsx
  notice-watermark.tsx
  notice-sheet.tsx
  shared.tsx
```

---

## Print rules

- Dashboard hero/KPI hidden (`.print-hidden`)
- `.dn-section { break-inside: avoid }`
- `print-color-adjust: exact` for summary + watermark
- Bilingual Hindi labels hidden on print

---

## QR / barcode

`lib/qc/demand-notice-codes.ts` — QR encodes verify URL; barcode is Code128 of `propertyId`.
