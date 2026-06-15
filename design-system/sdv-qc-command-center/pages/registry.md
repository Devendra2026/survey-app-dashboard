# Registry Page Overrides

> **PROJECT:** SDV QC Command Center
> **Generated:** 2026-06-13 18:45:15
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1400px or full-width
- **Grid:** 12-column grid for data flexibility
- **Sections:** 1. Hero, 2. Problem intro, 3. Comparison table (product vs competitors), 4. Pricing (optional), 5. CTA

### Spacing Overrides

- **Content Density:** High — optimize for information display

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Navy header tint + amber QC accent border. Status row tints from `SURVEY_ROW_TONE`.
- **Duplicate badge:** Brand red when same parcel has different owners; muted amber for shared parcel only.

### Table Columns (registry + ward report)

1. S.No · 2. Action · 3. Status · 4. Surveyor Name · 5. Property ID · 6. Ward Number · 7. Parcel Number (+ duplicate badge) · 8. Property Use · 9. Owner Name · 10. Mobile · 11. Date

### Component Overrides

- Use shared `QcDataTable` with horizontal scroll on mobile (`min-w-[1100px]`)
- Parcel duplicate badge inline in Parcel column — not a combined Registry Slot column
- Avoid: Wide tables breaking layout without scroll wrapper
- Avoid: Single row actions only

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Hover tooltips, chart zoom on click, row highlighting on hover, smooth filter animations, data loading spinners
- Responsive: Use horizontal scroll or card layout
- Data Entry: Allow multi-select and bulk edit
- Sustainability: Click-to-play or pause when off-screen
- CTA Placement: Table: Right column. CTA: Below table
