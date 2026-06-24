/**
 * Verify Clerk publishable key, secret key, and JWT issuer refer to the same Clerk app.
 *
 * Usage:
 *   node ./scripts/verify-clerk-keys.mjs           # .env.local (dev)
 *   node ./scripts/verify-clerk-keys.mjs --prod    # .env.production
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnvFile, resolveWebEnvPath } from "./read-env-file.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isProd = process.argv.includes("--prod");
const envPath = resolveWebEnvPath(root, isProd ? "production" : "local");
const envLabel = isProd ? ".env.production" : ".env.local";

let failed = false;

function fail(msg) {
  console.error(`[verify-clerk-keys] ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`[verify-clerk-keys] OK — ${msg}`);
}

function issuerFromPublishableKey(pk) {
  const match = pk.trim().match(/^pk_(?:test|live)_(.+)$/);
  if (!match) return null;
  try {
    const host = Buffer.from(match[1], "base64").toString("utf8").replace(/\$$/, "");
    return `https://${host}`;
  } catch {
    return null;
  }
}

if (!existsSync(envPath)) {
  fail(`Missing ${envLabel}`);
  process.exit(1);
}

const env = parseEnvFile(envPath);
const pk = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? null;
const sk = env.CLERK_SECRET_KEY ?? null;
const issuer = env.CLERK_JWT_ISSUER_DOMAIN ?? null;

if (!pk) fail(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing in ${envLabel}`);
if (!sk) fail(`CLERK_SECRET_KEY missing in ${envLabel}`);
if (!issuer) fail(`CLERK_JWT_ISSUER_DOMAIN missing in ${envLabel}`);

if (pk && sk) {
  const pkEnv = pk.startsWith("pk_test_") ? "test" : pk.startsWith("pk_live_") ? "live" : null;
  const skEnv = sk.startsWith("sk_test_") ? "test" : sk.startsWith("sk_live_") ? "live" : null;
  if (!pkEnv) fail("Publishable key must start with pk_test_ or pk_live_");
  if (!skEnv) fail("Secret key must start with sk_test_ or sk_live_");
  if (pkEnv && skEnv && pkEnv !== skEnv) {
    fail(`Key environment mismatch: publishable is ${pkEnv}, secret is ${skEnv}`);
  } else if (pkEnv && skEnv) {
    ok(`Both keys use Clerk ${pkEnv} environment`);
  }
  if (isProd && pkEnv === "test") {
    fail("Production env file must use pk_live_ / sk_live_ keys");
  }
}

if (pk && issuer) {
  const pkIssuer = issuerFromPublishableKey(pk);
  if (!pkIssuer) {
    fail("Could not decode issuer from publishable key");
  } else if (pkIssuer !== issuer) {
    fail(
      `CLERK_JWT_ISSUER_DOMAIN (${issuer}) does not match publishable key (${pkIssuer}).\n` +
        `  Re-copy both keys from the same Clerk app in the dashboard.`,
    );
  } else {
    ok(`Publishable key and issuer match (${issuer})`);
  }
}

const convexUrl = env.NEXT_PUBLIC_CONVEX_URL?.trim();
if (isProd && convexUrl && convexUrl.includes("sdvedytech")) {
  fail(`NEXT_PUBLIC_CONVEX_URL typo: use api.sdvedutech.in (not sdvedytech)`);
} else if (isProd && convexUrl) {
  ok(`Convex URL (${convexUrl})`);
}

const webhook = env.CLERK_WEBHOOK_SECRET?.trim();
if (isProd && (!webhook || webhook === "whsec_xxx" || webhook.includes("xxx"))) {
  fail("Set real CLERK_WEBHOOK_SECRET in .env.production (Clerk Dashboard → Webhooks → Signing secret)");
} else if (isProd && webhook) {
  ok("CLERK_WEBHOOK_SECRET present");
}

if (failed) {
  console.error(`\n[verify-clerk-keys] Fix ${envLabel}, then re-run.\n`);
  process.exit(1);
}

console.log(`\n[verify-clerk-keys] Clerk keys in ${envLabel} are aligned.\n`);
