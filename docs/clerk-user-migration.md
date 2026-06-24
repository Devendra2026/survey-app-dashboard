# Clerk user migration strategy (dev → production)

Clerk **does not allow** migrating users from a Development instance to a Production instance. This project uses:

| Instance | Keys | Purpose |
|----------|------|---------|
| `organic-halibut-21` | `pk_test_` / `sk_test_` | Local dev only |
| `clerk.sdvedutech.in` | `pk_live_` / `sk_live_` | Production web + fleet APK |

## Chosen approach: clean cutover with admin re-provisioning

**Recommendation for SDV:** Use a **clean cutover** — users sign up or are invited on production Clerk; Convex rows are created via webhook or `provisionCurrentUser` fallback.

### Why clean cutover

- Small/medium user base (~36 users in prod Convex per post-import checklist)
- Avoids password hash import complexity
- Convex already keys users by `clerkId` ([convex/schema.ts](../convex/schema.ts) `by_clerkId` index) — new Clerk IDs get new rows

### Cutover steps

1. **Before cutover:** Export list of active users (email, role, district) from Convex admin for reference
2. **Deploy production Clerk** (Dashboard checklist complete)
3. **Admins sign in first** on production web — webhook creates `users` rows
4. **Promote roles** via existing admin UI (or seed admin via Clerk Dashboard invite)
5. **Field users:** distribute new APK with `pk_live_`; users sign up on production
6. **Orphan rows:** Old `users` documents with dev `clerkId` values can be soft-deleted or marked inactive after cutover window

### Convex identity bridge

```text
ctx.auth.getUserIdentity().subject  →  users.clerkId
```

New production sign-ins get a new `clerkId`. Historical survey data tied to old Convex `users._id` is preserved; link users by email in admin if needed.

## Alternative: bulk import (optional)

Use if you must preserve passwords without reset:

1. Export from dev Clerk Dashboard (CSV with hashed passwords) — **only works within same instance type for re-import to prod via CreateUser API**
2. [Clerk migration tool](https://clerk.com/docs/guides/development/migrating/overview) → production `CreateUser` with `password_hasher` + `password_digest`
3. Set `external_id` to legacy ID if needed
4. One-time Convex script to match `external_id` or email → existing `users` row and update `clerkId`

Rate limit: 1000 creates / 10s on production.

## What we are not doing

- Migrating dev Clerk users directly to prod Clerk (impossible per Clerk)
- Running dev and prod Clerk against the same Convex deployment long-term (issuer is single-valued on Convex)

## Communication template

> Production sign-in now uses clerk.sdvedutech.in. Install the new field APK. Create your account (or use the invite link). Dev test accounts on the old app no longer work on production.
