# Production Readiness — Testing Results

Generated after implementation of QC Final Report Excel export and demand notice UI fixes.

## Automated checks

| Check                            | Result                                                    |
| -------------------------------- | --------------------------------------------------------- |
| `npm run typecheck`              | Pass                                                      |
| `npm test` (39 tests)            | Pass                                                      |
| `npm run build`                  | Pass                                                      |
| `npm run verify:clerk-keys`      | Pass                                                      |
| `npm run verify:google-maps-key` | Pass                                                      |
| `npm run lint:convex`            | Pre-existing errors in `convex/` (unchanged this release) |

## Mobile API contract

| Item                                                               | Status   |
| ------------------------------------------------------------------ | -------- |
| `convex/surveys.ts` aliases unchanged                              | Verified |
| No Convex schema changes                                           | Verified |
| No changes to `survey.saveDraft`, `submit`, `photos.*`, `floors.*` | Verified |
| Excel export uses read-only `surveyExport.listForExport`           | Verified |

## QC Supervisor workflow (code + route verification)

| Action      | Route           | API                       | Status      |
| ----------- | --------------- | ------------------------- | ----------- |
| View        | `/qc/[id]`      | `survey.get`              | Implemented |
| Edit + Save | `/qc/[id]/edit` | `survey.saveDraft` + `id` | Implemented |
| Approve     | Action bar      | `qc.decide(approve)`      | Implemented |
| Reopen      | Approved review | `qc.reopen`               | Implemented |
| Registry    | `/qc/registry`  | `survey.listPaginated`    | Implemented |

Manual browser UAT on production/staging recommended after web deploy.

## QC Final Report Excel export

| Requirement      | Implementation                                                     |
| ---------------- | ------------------------------------------------------------------ |
| Approved only    | `qcStatus: "approved"` hardcoded in export query                   |
| Single worksheet | `QC Final Report` sheet via `lib/reports/qc-final-report-excel.ts` |
| UI entry         | Export button on `/reports/qc-final` hero                          |
| Large datasets   | Paginated `listForExport`; warns at 5000 scope limit               |
| Unit tests       | `lib/reports/qc-final-report-excel.test.ts`                        |

## Demand notice

| Item                                                        | Status                               |
| ----------------------------------------------------------- | ------------------------------------ |
| Tax label percentages from config                           | Fixed in `notice-demand-summary.tsx` |
| QC approval message on QC route                             | Fixed in `demand-notice-view.tsx`    |
| Tax formula changes (`usageMultipliers`, `roadTypeFactors`) | Deferred (backward compatible)       |

## Regression matrix

| #   | Test                         | Mobile impact                              |
| --- | ---------------------------- | ------------------------------------------ |
| 1   | Mobile survey APIs unchanged | None                                       |
| 2   | `api.surveys.list` alias     | Unchanged                                  |
| 3   | QC web workflows             | Existing APIs only                         |
| 4   | Real-time Convex             | No backend deploy required                 |
| 5   | Excel approved-only filter   | Client read-only                           |
| 6   | Single worksheet export      | Client-only                                |
| 7   | Demand notice display fixes  | Web UI only                                |
| 8   | Auth env alignment           | See `production-verification-checklist.md` |

## Deployment recommendation

1. **Deploy web frontend only** to Dokploy (no Convex deploy needed for this release).
2. Rebuild so `NEXT_PUBLIC_*` vars are inlined.
3. Smoke test: sign in → `/reports/qc-final` → Export Excel → verify single sheet and approved rows only.
4. Mobile APK **does not** need redeploy unless Convex URL or Clerk keys change.
