# Surveys Page Overrides

> **PROJECT:** SDV Survey Dashboard
> **Generated:** 2026-06-13 16:28:31
> **Page Type:** Survey Management / Registry

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/sdv-survey-dashboard/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** Full-width within dashboard shell
- **Section order:** Hero → 5 KPI metrics → Smart Filters → Survey Registry (search + tabs + table) → Pagination
- **Content Density:** High — optimize for registry scanning

### Spacing Overrides

- **Metrics grid:** `xl:grid-cols-5` — Field Drafts, Total, QC Pending, Approved, Today
- **Registry table:** Horizontal scroll on mobile (`overflow-x-auto`)

### Color Overrides

- **Primary:** SDV brand navy `#002366` (`--brand-navy`) — table headers, View action
- **Accent / CTA:** SDV brand red `#CC0000` (`--brand-red`) — hero New Survey
- **Success:** emerald `--success` — Approved tab
- **Warning:** amber `--warning` — QC Pending tab
- **Cards:** `GlassCard` with `border-primary/15`, `shadow-premium-sm`

### Typography Overrides

- **KPI values:** `font-mono tabular-nums` on `MetricCard`
- **Section titles:** Plus Jakarta (`font-display` / `font-heading`)
- **Property ID / Parcel / Mobile:** Fira Code (`font-mono tabular-nums`)
- **Body & labels:** Fira Sans (`font-sans`)

### Component Overrides

- **Smart Filters:** Geography, status, and date range only — no global search, no month picker
- **Registry search:** Inline above status tabs (QC pattern)
- **Table columns:** S.No, Action, Status (QC), Surveyor, Property ID, Ward, Parcel, Owner, Mobile, Date
- Lucide icons only; `cursor-pointer` + `transition-colors duration-200` on interactive elements
- Row tone by QC/survey status via `SURVEY_ROW_TONE`

---

## Page-Specific Components

- `SurveysPageHero` — executive hero with export / reassign / new survey actions
- `SurveysMetricsSection` — 5 KPI cards (no rejection rate)
- `SurveysFiltersSection` — Smart Filters glass card
- `SurveysRegistrySection` — search bar, status tabs, registry table
- `SurveyRegistrySearch` — table-scoped search input

---

## Recommendations

- Effects: Row highlighting on hover, smooth filter transitions, skeleton loading for table
- Avoid: Photo thumbnails in registry table
- Avoid: Rejection rate KPI on this page
