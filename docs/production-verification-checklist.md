# Production Verification Checklist

Generated as part of production readiness review. Re-run scripts before each deploy.

## Automated checks

```bash
cd sdv-front-new-app
npm run verify:clerk-keys:prod
npm run verify:clerk-production

cd ../survey-app
npm run verify:env-prod
npm run verify:clerk-convex:prod
```

## Environment alignment

| Check                    | Status | Notes                                                                           |
| ------------------------ | ------ | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL` | OK     | `https://api.sdvedutech.in` (typo `sdvedytech` fixed in `.env.production`)      |
| Clerk prod keys          | Manual | `npm run verify:clerk-keys:prod` — requires `CLERK_WEBHOOK_SECRET` in `.env.production` |
| Convex issuer on deployment | Manual | `npm run sync:clerk:prod` after webhook secret set                         |
| Mobile fleet `.env.prod` | OK     | `pk_live_` aligned with web `.env.production`                                   |
| Mobile EAS env           | Manual | `npm run env:sync:preview` then `verify:clerk-convex:prod`                      |
| Google Maps Static API   | OK     | `npm run verify:google-maps-key`                                                |

## Ops gaps (document only)

- No automated deploy CI (only `react-doctor.yml`)
- `CLERK_WEBHOOK_SECRET` must be set in `.env.production` (not placeholder)
- `NEXT_PUBLIC_*` requires Dokploy rebuild after changes — see [dokploy-production-deploy.md](./dokploy-production-deploy.md)
- Clerk Dashboard: [clerk-production-dashboard.md](./clerk-production-dashboard.md)
- User cutover: [clerk-user-migration.md](./clerk-user-migration.md)
- Backups: `npm run convex:export:prod` — see `convex-backups/README.md`
- Domain typo risk: `sdvedytech.in` vs `sdvedutech.in` in some docs

## Smoke tests (manual)

1. Clerk sign-in on web — Convex queries succeed (no dev keys banner)
2. Clerk webhook test event → 200 on `https://site.sdvedutech.in/clerk-webhook`
3. `/qc` — command center loads
4. Mobile: fresh APK sign-in → `currentUser` populated
5. Mobile: draft → submit → QC approve — `qcStatus` updates
6. Photo upload via `photos.generateUploadUrl`
7. Real-time sync between web QC edit and mobile subscription

## Convex mirror drift

- `survey-app/convex/surveyFieldValidation.ts` exists only in mobile mirror (client-side validation helper pattern)
