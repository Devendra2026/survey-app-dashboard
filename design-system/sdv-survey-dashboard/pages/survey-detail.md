# Survey Detail Page Overrides

> **PROJECT:** SDV Survey Dashboard
> **Generated:** 2026-06-13
> **Page Type:** Survey View / Detail

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/sdv-survey-dashboard/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Route:** `/surveys/[id]` (read-only detail with inline GPS edit when permitted)
- **Section order:** Hero metadata → Property Identification → Owner & Household → Address + GIS → Taxation → Floor Details → Municipal Services → Photos → QC Remarks → Audit → Progress footer
- **Hero:** Compact record header — title bar with Edit/Delete actions, then inline fields (Property ID, ULB, Ward, Owner) with Status badges on the right. No PDF export on this page.

### Spacing Overrides

- **Hero metadata:** 2-col grid on mobile, 5-col on `lg+`
- **Floor table:** Horizontal scroll on mobile (`overflow-x-auto` on wrapper)
- **GIS panel:** Full-width in 2-col Address/GIS grid

### Color Overrides

- **Primary:** SDV brand navy `--brand-navy` — table headers, Edit button, GPS save
- **Accent / CTA:** SDV brand red `--brand-red` — Delete, hero eyebrow
- **Success:** `--success` — built-up area metric card
- **Warning:** `--warning` — required photo badges
- **Cards:** `GlassCard` + `premium-card` + `shadow-premium-sm`

### Typography Overrides

- **Hero title (Property ID):** `font-display` + `font-mono tabular-nums` in metadata chip
- **Section titles:** Plus Jakarta (`font-heading` / `font-display`)
- **Property ID / GPS coords / floor areas:** Fira Code (`font-mono tabular-nums`)
- **Body & labels:** Fira Sans (`font-sans`)

### Component Overrides

- **SurveyViewHero:** Property ID via `resolveDisplayPropertyId`, Owner via `resolveOwnerDisplayName` (never respondent in header)
- **FloorsTable columns:** S. No, Floor, Usage type, Usage factor, Construction, Area (Sqft)
- **GpsEditPanel:** Browser capture + manual lat/long inputs when `canEdit`; read-only map preview otherwise
- Lucide icons only; `cursor-pointer` + `transition-colors duration-200` on interactive elements

---

## Page-Specific Components

- `SurveyViewHero` — metadata hero with status badges and actions
- `GpsEditPanel` — GPS capture, manual coordinate edit, map preview
- `SurveyDetailView` — full survey detail sections (shared with QC review)

---

## Recommendations

- Effects: Row striping on floor table, smooth GPS save feedback via toast
- Avoid: Respondent name in hero header
- Avoid: Property ID column in floor table (shown in hero only)
- QC review (`/qc/[id]`) reuses `SurveyViewHero` with `canEdit={false}` and amber gradient
