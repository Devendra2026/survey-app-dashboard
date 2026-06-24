/**
 * Sync CLERK_JWT_ISSUER_DOMAIN (and optional CLERK_WEBHOOK_SECRET) from a dotenv file
 * to the active Convex deployment.
 *
 * Usage:
 *   node ./scripts/sync-clerk-issuer.mjs           # reads .env.local (dev)
 *   node ./scripts/sync-clerk-issuer.mjs --prod    # reads .env.production (self-hosted prod)
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyConvexSelfHostedEnv, parseEnvFile, resolveWebEnvPath } from "./read-env-file.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isProd = process.argv.includes("--prod");
const envPath = resolveWebEnvPath(root, isProd ? "production" : "local");
const env = parseEnvFile(envPath);

if (Object.keys(env).length === 0) {
  console.error(`[sync-clerk-issuer] Missing ${isProd ? ".env.production" : ".env.local"}`);
  process.exit(1);
}

const issuer = env.CLERK_JWT_ISSUER_DOMAIN?.trim();
if (!issuer?.startsWith("https://")) {
  console.error(
    `[sync-clerk-issuer] Set CLERK_JWT_ISSUER_DOMAIN=https://…. in ${isProd ? ".env.production" : ".env.local"}`,
  );
  process.exit(1);
}

if (isProd) {
  const { url, adminKey } = applyConvexSelfHostedEnv(envPath);
  if (!url || !adminKey) {
    console.error(
      "[sync-clerk-issuer] .env.production needs CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY for --prod",
    );
    process.exit(1);
  }
  if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
    console.warn(
      `[sync-clerk-issuer] CONVEX_SELF_HOSTED_URL is ${url} — use the public API URL (e.g. https://api.sdvedutech.in) when syncing prod from your workstation.`,
    );
  }
}

console.log(`[sync-clerk-issuer] Setting Convex env to ${issuer} (from ${isProd ? ".env.production" : ".env.local"})`);
execSync(`npx convex env set CLERK_JWT_ISSUER_DOMAIN "${issuer}"`, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

const webhookSecret = env.CLERK_WEBHOOK_SECRET?.trim();
if (webhookSecret) {
  if (webhookSecret === "whsec_xxx" || webhookSecret.includes("xxx")) {
    console.warn(
      "[sync-clerk-issuer] CLERK_WEBHOOK_SECRET looks like a placeholder — copy the real signing secret from Clerk Dashboard → Webhooks",
    );
  } else {
    console.log("[sync-clerk-issuer] Setting CLERK_WEBHOOK_SECRET on Convex deployment");
    execSync(`npx convex env set CLERK_WEBHOOK_SECRET "${webhookSecret}"`, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
  }
} else {
  console.warn("[sync-clerk-issuer] CLERK_WEBHOOK_SECRET not set — user provisioning webhook may fail");
}

console.log("[sync-clerk-issuer] Done.");
