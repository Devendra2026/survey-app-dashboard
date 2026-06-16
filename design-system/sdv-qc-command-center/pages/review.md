# Review Page Overrides

> **PROJECT:** SDV QC Command Center
> **Page Type:** QC single-record review

> Rules in this file **override** the Master file. For all other rules, refer to [`MASTER.md`](../MASTER.md).

---

## Layout

- **Max width:** Match QC portal (`max-w-360`)
- **Sections:** Back nav → Hero → Approved banner (when applicable) → Conflict panel (when siblings exist) → Detail sections → Sticky action bar

## Hero

- No **QC Report** shortcut in the review hero — report remains on `/qc/[id]/report` and registry flows.

## Action bar

| State          | Primary actions                                                     |
| -------------- | ------------------------------------------------------------------- |
| Pending review | Edit, Approved (approve as-is)                                      |
| Edit — unsaved | Review link, **Save**                                               |
| Edit — saved   | Review link, **Approved**                                           |
| Approved       | **Reopen for review** (confirmation dialog with reason → edit page) |

- **Save** requires `qc.review` or `surveys.editDraft`.
- **Re-write** is removed — supervisors correct data in-place or reopen after approval.

## Conflict panel (duplicate parcel)

When multiple records share ward + parcel with **different owners**:

- Amber-bordered `GlassCard` with `AlertTriangle` icon
- Callout: "Likely field numbering overlap — compare photos and GPS before approving both records."
- Sibling table columns: Property ID · Ward · Parcel · Property Use · Owner · QC · Actions
- **Current record** row highlighted with amber ring; siblings listed below
- "Reject duplicate" uses brand red accent (`QC_DUPLICATE_BADGE.rejectButton`)

## Typography

- Hero title: `font-display`
- Property ID / ward / parcel: `font-mono`
- Owner / surveyor: `font-sans` body weight 500

## Colors

- Conflict severity: brand red for duplicate badge + reject CTA
- Panel chrome: amber warning (`QC_MODULE.accent`)
- Structure: brand navy text on `#F8FAFC` canvas
