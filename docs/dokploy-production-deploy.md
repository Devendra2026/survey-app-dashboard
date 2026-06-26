# Dokploy production deploy (Clerk + Convex)

Use [`.env.production`](../.env.production) as the source of truth for Dokploy environment variables.

## Pre-deploy

```bash
cd sdv-front-new-app
npm run verify:clerk-production
```

Ensure `CLERK_WEBHOOK_SECRET` is set (not empty) and run:

```bash
npm run sync:clerk:prod
```

## Dokploy environment variables

| Variable                            | Notes                          |
| ----------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` — inlined at build |
| `CLERK_SECRET_KEY`                  | `sk_live_…` — server only      |
| `CLERK_JWT_ISSUER_DOMAIN`           | `https://clerk.sdvedutech.in`  |
| `NEXT_PUBLIC_CONVEX_URL`            | `https://api.sdvedutech.in`    |
| `NEXT_PUBLIC_CONVEX_SITE_URL`       | `https://site.sdvedutech.in`   |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`   | If GIS features used           |

`CLERK_WEBHOOK_SECRET` is set on **Convex**, not Next.js (via `sync:clerk:prod`).

## Deploy

1. Update env vars in Dokploy from `.env.production`
2. **Build** with production Convex URL (required — plain `npm run build` uses `.env.local` and points at Convex Cloud dev):

   ```bash
   npm run build:prod
   ```

   Or set `NEXT_PUBLIC_CONVEX_URL=https://api.sdvedutech.in` in Dokploy **before** `next build` (process env beats `.env.local`).

3. Smoke test:
   - Sign in — no “development keys” banner
   - `/dashboard` loads
   - Clerk webhook delivery log shows 200 for test event

## Backend deploy (Convex functions)

```bash
npm run deploy:backend:prod
# or: npm run convex:deploy:selfhosted
```

This loads `CONVEX_SELF_HOSTED_URL` from `.env.production` so functions deploy to `https://api.sdvedutech.in`, not the Convex Cloud dev deployment in `.env.local`.

## Mobile coordination

After web is live on production Clerk:

```bash
cd ../survey-app
npm run env:sync:preview
npm run eas:build:android:preview
```

See [CLERK_PK_LIVE_MIGRATION.md](../../survey-app/docs/CLERK_PK_LIVE_MIGRATION.md).
