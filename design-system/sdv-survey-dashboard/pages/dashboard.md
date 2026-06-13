# Dashboard Page Overrides

> **PROJECT:** SDV Survey Dashboard
> **Generated:** 2026-06-13 14:07:03
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1400px or full-width
- **Grid:** 12-column grid for data flexibility
- **Sections:** 1. Dynamic hero (personalized), 2. Relevant features, 3. Tailored testimonials, 4. Smart CTA

### Spacing Overrides

- **Content Density:** High — optimize for information display

### Color Overrides

- **Primary:** SDV brand navy `#002366` (`--brand-navy`) — KPI borders, chart primary
- **Accent / CTA:** SDV brand red `#CC0000` (`--brand-red`) — hero actions
- **Success:** emerald `--success` — Approved QC
- **Warning:** amber `--warning` / `--chart-caution` — Pending QC, Today KPI
- **Background:** cool off-white `--background` with glass cards (`GlassCard`)

### Typography Overrides

- **KPI values:** `font-mono tabular-nums` on `MetricCard` for data-dense readability
- **Section titles:** Plus Jakarta (`font-display` / `font-heading`)
- **Body & chart labels:** Fira Sans (`font-sans`)

### Section Order

1. Executive hero with quick actions (Surveys, QC Queue)
2. KPI Metrics — 5 cards (`xl:grid-cols-5`)
3. Organization — 4 cards (`lg:grid-cols-4`)
4. Productivity Analytics — trend + surveyor + QC supervisor charts
5. Coverage — ward chart + municipality performance
6. Activity feed

### Component Overrides

- Use Lucide icons only; `cursor-pointer` + `transition-colors duration-200` on links
- Skeleton counts: 5 KPI, 4 organization
- Surveyor & QC productivity charts filter to **active users only**

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Hover tooltips, chart zoom on click, row highlighting on hover, smooth filter animations, data loading spinners
- Animation: Use skeleton screens or spinners
- Data Entry: Allow multi-select and bulk edit
- Sustainability: Click-to-play or pause when off-screen
- CTA Placement: Context-aware placement based on user segment
