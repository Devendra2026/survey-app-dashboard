# SDV admin web + canonical Convex backend

Next.js dashboard for survey QC, analytics, masters, and users. **This repo owns the shared Convex backend** used by the mobile app (`../survey-app`).

## Shared backend

| Concern       | This repo (web)                         | Mobile (`../survey-app`)                                            |
| ------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Convex source | `convex/` — edit here only              | `convex/` is a mirror for types; sync from web when backend changes |
| Dev server    | `npm run dev` → Next.js + `convex dev`  | `npm run dev` → Expo only (connects to same deployment)             |
| Env URL       | `NEXT_PUBLIC_CONVEX_URL`                | `EXPO_PUBLIC_CONVEX_URL` — **must be identical**                    |
| Clerk         | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`     | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — **same Clerk app**            |
| Deploy        | `npx convex deploy` from this directory | Do **not** deploy Convex from mobile                                |

## Getting started

1. Copy env and fill from Convex dashboard + Clerk:

   ```bash
   cp .env.example .env.local   # if present; otherwise create .env.local
   ```

   Required in `.env.local`:
   - `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   - `CLERK_JWT_ISSUER_DOMAIN` (also set on deployment: `npx convex env set CLERK_JWT_ISSUER_DOMAIN …`)

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Point the mobile app at the same deployment (see `../survey-app/.env.example`).

## Production

```bash
npx convex deploy
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://…" --prod
```

Register Clerk webhook: `<CONVEX_SITE_URL>/clerk-webhook`.
