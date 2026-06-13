# Survey Edit Page Overrides

> **PROJECT:** SDV Survey Dashboard
> **Generated:** 2026-06-13
> **Page Type:** Survey Edit / Form

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/sdv-survey-dashboard/MASTER.md`).

---

## Page-Specific Rules

### Layout Overrides

- **Route:** `/surveys/[id]/edit`
- **Header:** Compact `SurveyViewHero` with title "Survey Edit" — Property ID, ULB, Ward, Owner; View detail action only (no status in header)
- **Tabs:** Details → Area → Photos → GPS

### Floor Details (Area tab)

- **Table columns:** S. No, Floor, Usage type, Usage factor, Construction, Area, Actions
- **CRUD:** Add floor / Add open land, Edit dialog, Delete with confirm
- **Dialog fields:** Floor, Usage type, Usage factor, Construction, Area, Position
- Navy gradient table header; `font-mono tabular-nums` for S. No and Area

### GPS tab

- `GpsEditPanel` inside `GpsCapturePanel` — browser capture + manual lat/long inputs
- Map preview with Google Maps link when coordinates exist

### Typography & Colors

- Headings: Plus Jakarta (`font-heading` / `font-display`)
- IDs, coordinates, areas: Fira Code (`font-mono tabular-nums`)
- Body: Fira Sans
- Primary actions: `--brand-navy`; destructive: `--brand-red`
- Tab active state: brand navy background

### UX Checklist

- `cursor-pointer` + `transition-colors duration-200` on all interactive elements
- Lucide icons only
- Confirm before floor delete
- Area must be > 0 to save floor row
