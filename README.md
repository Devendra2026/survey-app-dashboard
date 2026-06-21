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

### Troubleshooting local dev

- **`Could not find public function for 'surveys:list'`** — Run `npm run dev` (starts **both** Next.js and `convex dev`). If you only ran `next dev`, push functions once: `npx convex dev --once`. Public API is `survey:list` (`convex/survey.ts`); `surveys:list` is a compatibility alias.
- **Browser: “Clerk has been loaded with development keys”** — Expected while using `pk_test_…` / `organic-halibut-21`. Safe to ignore during development.
- **`Failed to fetch RSC payload`** — Often a side effect of the Convex error above or a dev-server restart; fix Convex first, then hard-refresh the browser.
- **Clerk `token-iat-in-the-future` or infinite redirect loop** — Usually stale session cookies or mismatched Clerk keys.
  1. Enable **Settings → Time & language → Set time automatically** (or run `w32tm /resync /force` in an Admin PowerShell if the Windows Time service is running).
  2. Clear Clerk cookies for localhost (`__session`, `__client_uat`, `__clerk_db_jwt`) or use an **Incognito** window.
  3. Re-copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the **same** Clerk app ([API keys](https://dashboard.clerk.com/last-active?path=api-keys)); verify with `node scripts/verify-clerk-keys.mjs`.
  4. Sync Convex issuer: `npm run deploy:backend:dev`, then from `../survey-app`: `node scripts/verify-clerk-convex.mjs`.

## Production

```bash
npx convex deploy
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://…" --prod
```

Register Clerk webhook: `<CONVEX_SITE_URL>/clerk-webhook`.

## Google Maps (GIS)

Survey GPS coordinates are displayed via **Maps Embed API** (iframe) and **Maps Static API** (print/PDF). Browser GPS capture uses `navigator.geolocation` — not Google's Geolocation API.

1. Add to `.env.local` (see [`.env.example`](.env.example)):

   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

2. In [Google Cloud Console](https://console.cloud.google.com/google/maps-apis), enable **billing** and these APIs:
   - **Maps Embed API** (required for live map embeds)
   - **Maps Static API** (required for demand-notice print maps)

   The Maps JavaScript API is **not** required for this app.

3. Restrict the API key (HTTP referrers):
   - `http://localhost:3000/*`
   - `http://localhost:3001/*`
   - `https://*.vercel.app/*`
   - `https://YOUR-PRODUCTION-DOMAIN/*`

4. Verify locally:

   ```bash
   npm run verify:google-maps-key
   ```

5. **Vercel:** set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for Development, Preview, and Production, then **redeploy** (Next.js inlines `NEXT_PUBLIC_*` at build time).

Without a key, embeds fall back to a keyless URL and static maps are omitted. A dev-only GIS debug panel appears on survey GPS screens when `NODE_ENV=development`.

## Database & file storage backups

Full snapshots (tables + survey photos in Convex storage) live under `convex-backups/`. See [convex-backups/README.md](convex-backups/README.md) for export/import and dev→prod sync (`npm run convex:export:dev`, `npm run convex:import:prod`, etc.).
