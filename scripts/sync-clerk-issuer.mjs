/**
 * Sync CLERK_JWT_ISSUER_DOMAIN from .env.local to the active Convex deployment.
 * Mismatched issuer (e.g. old Clerk instance on Convex) causes mobile + web auth failures.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("[sync-clerk-issuer] Missing .env.local");
  process.exit(1);
}

const raw = readFileSync(envPath, "utf8");
const match = raw.match(/^CLERK_JWT_ISSUER_DOMAIN=(.+)$/m);
const issuer = match?.[1]?.trim().replace(/^["']|["']$/g, "");

if (!issuer?.startsWith("https://")) {
  console.error("[sync-clerk-issuer] Set CLERK_JWT_ISSUER_DOMAIN=https://….clerk.accounts.dev in .env.local");
  process.exit(1);
}

console.log(`[sync-clerk-issuer] Setting Convex env to ${issuer}`);
execSync(`npx convex env set CLERK_JWT_ISSUER_DOMAIN "${issuer}"`, {
  cwd: root,
  stdio: "inherit",
});

const webhookMatch = raw.match(/^CLERK_WEBHOOK_SECRET=(.+)$/m);
const webhookSecret = webhookMatch?.[1]?.trim().replace(/^["']|["']$/g, "");
if (webhookSecret) {
  console.log("[sync-clerk-issuer] Setting CLERK_WEBHOOK_SECRET on Convex deployment");
  execSync(`npx convex env set CLERK_WEBHOOK_SECRET "${webhookSecret}"`, {
    cwd: root,
    stdio: "inherit",
  });
} else {
  console.warn("[sync-clerk-issuer] CLERK_WEBHOOK_SECRET not found in .env.local — user provisioning webhook may fail");
}
