# React Doctor false positives

Documented suppressions after manual verification. Re-check when upgrading react-doctor or changing entry points.

Configured in `doctor.config.ts` via `ignore.overrides` where noted.

## deslop/unused-export

| Symbol / path                                             | Reason                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `convex/_generated/api.js`, `convex/_generated/server.js` | Convex codegen re-exports; never edit by hand — suppressed in `doctor.config.ts` |

## deslop/unused-file

| Path pattern                             | Reason                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `convex/**/*.ts`                         | Convex function modules are runtime entry points discovered by `convex dev`, not static import graph roots — suppressed in `doctor.config.ts` |
| `components/ui/**`                       | shadcn component inventory — installed ahead of use; bulk delete needs owner sign-off — suppressed in `doctor.config.ts`                      |
| `hooks/use-mobile.ts`                    | Used only by unused `sidebar.tsx`; remove together when sidebar ships or is deleted — suppressed in `doctor.config.ts`                        |
| `lib/qc/build-demand-notice-document.ts` | Imported from `convex/demandNoticeData.ts` (orphan from deslop's Next.js-only entry trace) — suppressed in `doctor.config.ts`                 |

## Follow-up recipe (unused-file ×~40 shadcn + sidebar chain)

1. **shadcn UI**: run `npx shadcn@latest remove <component>` for each confirmed-unused primitive after product sign-off — do not mass-delete in one PR.
2. **sidebar + use-mobile**: delete or wire into layout together.
3. **True orphans**: grep basename + dynamic imports, delete file, delete now-dead deps, re-run `npx react-doctor@latest --verbose`.

Removed in prior passes:

- `schema/masters/index.ts`, `schema/reports/index.ts` — duplicate DTO barrels with zero importers
- `components/qc/demand-notice/notice-data-card.tsx` — only importer (`notice-address-card.tsx`) was never wired into the document tree; address renders via `NoticeOwnerProfile`
