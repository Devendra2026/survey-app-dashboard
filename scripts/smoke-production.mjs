/**
 * Production smoke test orchestrator — runs automated checks; prints manual QA steps.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const surveyRoot = path.join(webRoot, "..", "survey-app");

let failed = false;

function run(label, cmd, cwd) {
  console.log(`\n[smoke:production] ${label}`);
  try {
    execSync(cmd, { cwd, stdio: "inherit", shell: true });
  } catch {
    failed = true;
  }
}

console.log("=== Clerk production smoke tests (automated) ===\n");

run("Web prod Clerk keys", "npm run verify:clerk-keys:prod", webRoot);
run("Web + mobile prod alignment", "npm run verify:clerk-production", webRoot);
run("Fleet env", "npm run verify:env-prod", surveyRoot);
run("Clerk + Convex prod", "npm run verify:clerk-convex:prod", surveyRoot);

console.log("\n=== Manual smoke tests (required before go-live) ===\n");
console.log("1. Web: sign in on production URL — no 'development keys' banner");
console.log("2. Web: /dashboard and /qc load with Convex data");
console.log("3. Clerk Dashboard: webhook test → 200 on https://site.sdvedutech.in/clerk-webhook");
console.log("4. Mobile: install APK built after env:sync:preview — sign in succeeds");
console.log("5. Mobile: submit survey → visible on web QC");
console.log("6. Real-time: edit on web reflects on mobile subscription\n");

if (failed) {
  console.error("[smoke:production] Automated checks failed — fix before manual QA.\n");
  process.exit(1);
}

console.log("[smoke:production] Automated checks passed. Complete manual steps above.\n");
