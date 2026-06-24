# Clerk production audit (2026-06-24)

Pre-implementation snapshot and fixes applied.

## Findings before rollout

| Check | Dev (`.env.local`) | Production target | Status after fixes |
|-------|-------------------|-------------------|-------------------|
| Web Clerk keys | `pk_test_` / `organic-halibut-21` | `pk_live_` / `clerk.sdvedutech.in` in `.env.production` | Prod file aligned |
| Mobile fleet (`.env.prod`) | **`pk_test_` + issuer `clerk.sdvedutech.in`** (broken) | Both `pk_live_` + `clerk.sdvedutech.in` | **Fixed** |
| Convex URL typo | `api.sdvedytech.in` in `.env.production` | `api.sdvedutech.in` | **Fixed** |
| Webhook secret | Placeholder `whsec_xxx` | Real secret from Clerk Dashboard | **Action required** — set in `.env.production` |
| Convex `CLERK_JWT_ISSUER_DOMAIN` | Set to `https://clerk.sdvedutech.in` via `npm run sync:clerk:prod` | **Done** |
| `CLERK_WEBHOOK_SECRET` | Set in `.env.production`, then `npm run sync:clerk:prod` | **Action required** |
| EAS preview/production | Synced `pk_live_` via `npm run env:sync:preview` | **Done** |

## Verification commands

```bash
# Dev alignment (local development only)
cd sdv-front-new-app && npm run verify:clerk-keys
cd ../survey-app && npm run verify:clerk-convex

# Production alignment (before deploy / APK build)
cd sdv-front-new-app && npm run verify:clerk-production
cd ../survey-app && npm run verify:env-prod && npm run verify:clerk-convex -- --prod
```

## Clerk constraint

Users on the **development** Clerk instance (`organic-halibut-21`) cannot be migrated to production. See [clerk-user-migration.md](./clerk-user-migration.md).

## Remaining manual steps

1. [clerk-production-dashboard.md](./clerk-production-dashboard.md) — complete Clerk Dashboard items (webhook endpoint, OAuth redirects)
2. Set `CLERK_WEBHOOK_SECRET` in `.env.production`, then `npm run sync:clerk:prod`
3. Dokploy: rebuild web with [`.env.production`](../.env.production) vars — see [dokploy-production-deploy.md](./dokploy-production-deploy.md)
4. Fleet APK: `cd ../survey-app && npm run eas:build:android:preview` (EAS build queued after env sync)
5. Manual smoke tests: `npm run smoke:production` (after webhook secret is set)
