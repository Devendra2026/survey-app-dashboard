# Post-import checklist — run after successful import on self-hosted Convex.
Write-Host @"
=== Post-import checklist ===

1. Clerk webhook
   - Dashboard -> Webhooks -> endpoint URL:
     https://site.sdvedutech.in/clerk-webhook
     (or your CONVEX_SITE_URL + /clerk-webhook)
   - Events: user.created, user.updated, user.deleted, session.created
   - Ensure CLERK_WEBHOOK_SECRET is set: npm run deploy:backend

2. Frontend (Vercel / Dokploy)
   - NEXT_PUBLIC_CONVEX_URL=https://api.sdvedutech.in
   - Redeploy so NEXT_PUBLIC_* is inlined at build time

3. Mobile (../survey-app)
   - EXPO_PUBLIC_CONVEX_URL=https://api.sdvedutech.in
   - Same Clerk publishable key as web

4. Verify data
   - npx convex data
   - Expect ~3534 surveys, ~7020 photos, ~36 users

5. Smoke test
   - Sign in via Clerk (not 'Not authenticated')
   - Open survey with photos (storage URLs load)
   - QC ward-scoped query for a surveyor
"@

Set-Location (Join-Path $PSScriptRoot "..")
Write-Host ""
Write-Host "=== npx convex data ==="
npx convex data 2>&1
