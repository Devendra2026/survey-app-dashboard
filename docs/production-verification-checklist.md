# Production Verification Checklist

Generated as part of production readiness review. Re-run scripts before each deploy.

## Environment alignment (verified)

| Check                    | Status | Notes                                                                           |
| ------------------------ | ------ | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL` | OK     | Points to `https://api.sdvedutech.in`                                           |
| Clerk keys aligned       | OK     | `npm run verify:clerk-keys`                                                     |
| Google Maps Static API   | OK     | `npm run verify:google-maps-key`                                                |
| Mobile EAS env           | Manual | Run `node ../survey-app/scripts/verify-clerk-convex.mjs` with EAS CLI logged in |

## Ops gaps (document only)

- No automated deploy CI (only `react-doctor.yml`)
- Confirm prod `CLERK_JWT_ISSUER_DOMAIN` on Convex deployment (not dev fallback)
- `NEXT_PUBLIC_*` requires Dokploy rebuild after changes
- Backups: `npm run convex:export:prod` — see `convex-backups/README.md`
- Domain typo risk: `sdvedytech.in` vs `sdvedutech.in` in some docs

## Smoke tests (manual)

1. Clerk sign-in on web — Convex queries succeed
2. `/qc` — command center loads
3. Mobile: draft → submit → QC approve — `qcStatus` updates
4. Photo upload via `photos.generateUploadUrl`
5. Real-time sync between web QC edit and mobile subscription

## Convex mirror drift

- `survey-app/convex/surveyFieldValidation.ts` exists only in mobile mirror (client-side validation helper pattern)
