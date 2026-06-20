/**
 * Verify NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and
 * CLERK_JWT_ISSUER_DOMAIN in .env.local refer to the same Clerk app.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(root, ".env.local");

let failed = false;

function fail(msg) {
  console.error(`[verify-clerk-keys] ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`[verify-clerk-keys] OK — ${msg}`);
}

function readEnv(key) {
  if (!existsSync(envPath)) {
    fail("Missing .env.local");
    return null;
  }
  const text = readFileSync(envPath, "utf8");
  const re = new RegExp(`^${key}=(.+)$`, "m");
  return text.match(re)?.[1]?.trim() ?? null;
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

const pk = readEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
const sk = readEnv("CLERK_SECRET_KEY");
const issuer = readEnv("CLERK_JWT_ISSUER_DOMAIN");

if (!pk) fail("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing in .env.local");
if (!sk) fail("CLERK_SECRET_KEY missing in .env.local");
if (!issuer) fail("CLERK_JWT_ISSUER_DOMAIN missing in .env.local");

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

if (failed) {
  console.error("\n[verify-clerk-keys] Fix .env.local, then restart `npm run dev`.\n");
  process.exit(1);
}

console.log("\n[verify-clerk-keys] Clerk keys in .env.local are aligned.\n");
