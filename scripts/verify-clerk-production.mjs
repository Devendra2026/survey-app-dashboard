/**
 * Production Clerk + Convex alignment checks across web and mobile.
 * Run before Dokploy deploy or fleet APK build.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnvFile } from "./read-env-file.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const surveyRoot = path.join(root, "..", "survey-app");

let failed = false;

function fail(msg) {
  console.error(`[verify-clerk-production] ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`[verify-clerk-production] OK — ${msg}`);
}

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

console.log("[verify-clerk-production] Web production Clerk keys…");
try {
  run("node ./scripts/verify-clerk-keys.mjs --prod", root);
} catch {
  failed = true;
}

const webProd = parseEnvFile(path.join(root, ".env.production"));
const fleetProd = parseEnvFile(path.join(surveyRoot, ".env.prod"));

if (!existsSync(path.join(surveyRoot, ".env.prod"))) {
  fail("survey-app/.env.prod missing");
}

const webPk = webProd.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const fleetPk = fleetProd.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

if (webPk && fleetPk && webPk === fleetPk) {
  ok("Web and mobile fleet use the same pk_live publishable key");
} else if (webPk && fleetPk) {
  fail("Web .env.production and survey-app .env.prod Clerk keys differ");
}

const convexUrl = webProd.NEXT_PUBLIC_CONVEX_URL?.trim();
const fleetConvex = fleetProd.EXPO_PUBLIC_CONVEX_URL?.trim();
if (convexUrl && fleetConvex && convexUrl === fleetConvex) {
  ok(`Shared Convex URL (${convexUrl})`);
} else if (convexUrl && fleetConvex) {
  fail(`Convex URL mismatch: web=${convexUrl}, mobile=${fleetConvex}`);
}

console.log("[verify-clerk-production] Cross-app Clerk + Convex (production)…");
try {
  run("node ./scripts/verify-clerk-convex.mjs --prod", surveyRoot);
} catch {
  failed = true;
}

if (failed) {
  console.error("\n[verify-clerk-production] Fix issues above before production deploy.\n");
  process.exit(1);
}

console.log("\n[verify-clerk-production] Production Clerk alignment checks passed.\n");
console.log("Next steps:");
console.log("  1. Complete Clerk Dashboard checklist: docs/clerk-production-dashboard.md");
console.log("  2. Set CLERK_WEBHOOK_SECRET in .env.production, then: npm run sync:clerk:prod");
console.log("  3. Dokploy: rebuild web with .env.production vars");
console.log("  4. Mobile: cd ../survey-app && npm run env:sync:preview && npm run eas:build:android:preview\n");
