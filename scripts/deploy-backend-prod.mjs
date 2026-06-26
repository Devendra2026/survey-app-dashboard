/**
 * Deploy Convex functions to self-hosted production.
 * Loads CONVEX_SELF_HOSTED_* from .env.production so `convex deploy` does not
 * target the dev cloud deployment linked in .env.local.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyConvexSelfHostedEnv, parseEnvFile, resolveWebEnvPath } from "./read-env-file.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolveWebEnvPath(root, "production");

if (!existsSync(envPath)) {
  console.error("[deploy-backend-prod] Missing .env.production");
  process.exit(1);
}

const prod = parseEnvFile(envPath);
for (const [key, value] of Object.entries(prod)) {
  process.env[key] = value;
}
const { url, adminKey } = applyConvexSelfHostedEnv(envPath);

if (!url || !adminKey) {
  console.error(
    "[deploy-backend-prod] Set CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY in .env.production",
  );
  process.exit(1);
}

const publicUrl = prod.NEXT_PUBLIC_CONVEX_URL?.trim();
console.log(`[deploy-backend-prod] Self-hosted backend: ${url}`);
console.log(`[deploy-backend-prod] Public API (web/mobile): ${publicUrl ?? "(not set)"}`);

if (publicUrl?.includes(".convex.cloud")) {
  console.error("[deploy-backend-prod] NEXT_PUBLIC_CONVEX_URL must be https://api.sdvedutech.in for production");
  process.exit(1);
}

execSync("node ./scripts/sync-clerk-issuer.mjs --prod", { cwd: root, stdio: "inherit", env: process.env });
execSync("npx convex deploy --yes --env-file .env.production", { cwd: root, stdio: "inherit", env: process.env });

console.log("[deploy-backend-prod] Done.");
