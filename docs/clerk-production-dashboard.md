# Clerk production Dashboard checklist

Complete these steps on the **production** Clerk instance (`clerk.sdvedutech.in`) before cutting over web and mobile clients.

## 1. Instance and domain

- [ ] Production instance is active (not development `organic-halibut-21`)
- [ ] Custom domain `clerk.sdvedutech.in` has valid DNS + SSL
- [ ] API keys copied: `pk_live_…`, `sk_live_…` → [`.env.production`](../.env.production) and [survey-app `.env.prod`](../../survey-app/.env.prod)

### SSL / TLS troubleshooting (mobile "Sign-in could not start")

If the fleet APK shows **Sign-in could not start** with Clerk host `clerk.sdvedutech.in`, the Clerk Frontend API is not reachable over HTTPS. The mobile app has **no CDN or Cloudflare dependency** — it only calls `https://clerk.sdvedutech.in` from the publishable key. Convex (`api.sdvedutech.in`) may still work; this is a **Clerk custom-domain / DNS** issue, not a wrong publishable key.

**Verify from your machine** (must return `200`, not `000` or SSL error):

```bash
curl.exe -s -o NUL -w "%{http_code}" "https://clerk.sdvedutech.in/v1/client"
```

Or from survey-app:

```bash
cd ../survey-app && npm run verify:clerk-reachability
```

**Fix checklist:**

1. **Clerk Dashboard** (production instance) → **Domains** / **Frontend API** → `clerk.sdvedutech.in` must show **Active** (not Pending or Failed). Re-run Verify if needed.
2. **DNS** — CNAME for `clerk` (or `clerk.sdvedutech.in`) must point to Clerk's target (`frontend-api.clerk.services`). `nslookup clerk.sdvedutech.in` should resolve to Clerk's edge. Prefer **DNS only** (no HTTP proxy in front of Clerk) unless you know how to terminate TLS end-to-end.
3. **If your DNS provider proxies traffic** (e.g. orange-cloud proxy) — SSL/TLS mode must be **Full** or **Full (strict)**, **not Flexible**. Flexible mode breaks TLS to Clerk and causes handshake failures on phones.
4. Wait up to 24h for certificate provisioning after DNS changes.
5. Once curl returns 200, force-close and reopen the mobile app (no APK rebuild needed if keys are already `pk_live_`).

**No APK rebuild required** after SSL is fixed — the app already uses `pk_live_…` → `clerk.sdvedutech.in`.

### Native applications (required for @clerk/expo on Android/iOS)

The mobile SDK sends `x-mobile: 1` and `_is_native=1` on Clerk API requests. If Native API is disabled, `useAuth().isLoaded` may stay `false` on devices even when `curl` returns 200.

1. **Clerk Dashboard** (production) → **Configure → Native applications**
2. Enable **Native API** for this instance
3. Register **Android** package name: `com.surveyapp.app` (from `survey-app/app.json`)
4. Add SHA-256 certificate fingerprints for your EAS preview/production signing keys (EAS Dashboard → Project → Credentials)
5. Rebuild the APK after adding fingerprints if Google/Apple native sign-in is used; email/password should work once Native API is enabled

## 2. Convex integration

- [ ] **Integrations → Convex → Activate** on production instance
- [ ] Session tokens include `aud: convex` (required by web `ConvexProviderWithClerk` and mobile `useAuthForConvex`)
- [ ] JWT issuer is `https://clerk.sdvedutech.in` → `CLERK_JWT_ISSUER_DOMAIN` in all env files

## 3. Webhook (user sync to Convex)

- [ ] **Webhooks → Add endpoint**
  - URL: `https://site.sdvedutech.in/clerk-webhook`
  - Events: `user.created`, `user.updated`, `user.deleted`
- [ ] Copy **Signing secret** → `CLERK_WEBHOOK_SECRET` in `.env.production`
- [ ] Run: `npm run sync:clerk:prod` (pushes secret to Convex deployment)
- [ ] Send test event from Dashboard → delivery log shows **200**

Handler: [convex/http.ts](../convex/http.ts) → `users.upsertFromClerk` / `softDeleteFromClerk`

## 4. OAuth and sign-in

- [ ] Google OAuth (and any other providers) configured on **production** with correct client IDs
- [ ] **Allowed redirect URLs** include:
  - Production web origin (Dokploy domain / `https://sdvedutech.in`)
  - Expo deep-link schemes from `survey-app/app.json`
- [ ] Sign-in / sign-up paths match web app: `/sign-in`, `/sign-up`

## 5. Security policy (field fleet)

- [ ] Review **Attack protection → Client Trust** for internal fleet needs
- [ ] Production has no 100 emails/month dev cap (unlike `pk_test_`)
- [ ] MFA / verification policy documented for field users

## 6. Session token (only if importing users with legacy IDs)

If bulk-importing users with `external_id` for Convex FK compatibility:

- [ ] **Sessions → Customize session token → Claims**:
  ```json
  { "userId": "{{user.external_id || user.id}}" }
  ```

Not required for clean cutover (users get new Clerk `user_…` IDs).

## 7. Post-configuration verification

```bash
cd sdv-front-new-app
npm run verify:clerk-keys:prod
npm run sync:clerk:prod
npm run verify:clerk-production

cd ../survey-app
npm run env:sync:preview
npm run verify:clerk-reachability
npm run verify:clerk-convex -- --prod
```

## Rollback

Revert Convex env to dev issuer, revert client env files to `pk_test_`, re-point webhook to dev instance, rebuild web + APK.
