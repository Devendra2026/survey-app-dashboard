# Clerk production Dashboard checklist

Complete these steps on the **production** Clerk instance (`clerk.sdvedutech.in`) before cutting over web and mobile clients.

## 1. Instance and domain

- [ ] Production instance is active (not development `organic-halibut-21`)
- [ ] Custom domain `clerk.sdvedutech.in` has valid DNS + SSL
- [ ] API keys copied: `pk_live_…`, `sk_live_…` → [`.env.production`](../.env.production) and [survey-app `.env.prod`](../../survey-app/.env.prod)

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
npm run verify:clerk-convex -- --prod
```

## Rollback

Revert Convex env to dev issuer, revert client env files to `pk_test_`, re-point webhook to dev instance, rebuild web + APK.
