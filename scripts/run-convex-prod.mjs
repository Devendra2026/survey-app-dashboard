/**
 * Run a Convex CLI command against self-hosted production.
 * Usage: node ./scripts/run-convex-prod.mjs run migrations/auditSurveyScopeStats:audit '{}'
 */
import { execSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyConvexSelfHostedEnv, parseEnvFile, resolveWebEnvPath } from "./read-env-file.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolveWebEnvPath(root, "production");
const localEnvPath = resolveWebEnvPath(root, "local");
const localEnvBackupPath = `${localEnvPath}.bak-run-convex-prod`;

if (!existsSync(envPath)) {
  console.error("[run-convex-prod] Missing .env.production");
  process.exit(1);
}

const prod = parseEnvFile(envPath);
for (const [key, value] of Object.entries(prod)) {
  if (key === "CONVEX_DEPLOYMENT") continue;
  process.env[key] = value;
}
const { url, adminKey } = applyConvexSelfHostedEnv(envPath);
delete process.env.CONVEX_DEPLOYMENT;

if (!url || !adminKey) {
  console.error("[run-convex-prod] Set CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY in .env.production");
  process.exit(1);
}

const cmd = process.argv.slice(2);
if (cmd.length === 0) {
  console.error("[run-convex-prod] Usage: node ./scripts/run-convex-prod.mjs <convex-args...>");
  process.exit(1);
}

console.log(`[run-convex-prod] Target: ${url}`);

let movedLocalEnv = false;
if (existsSync(localEnvPath)) {
  renameSync(localEnvPath, localEnvBackupPath);
  movedLocalEnv = true;
}

try {
  const command = `npx convex ${cmd.map((part) => (/\s/.test(part) ? `"${part.replace(/"/g, '\\"')}"` : part)).join(" ")}`;
  execSync(command, { cwd: root, stdio: "inherit", env: process.env });
} finally {
  if (movedLocalEnv && existsSync(localEnvBackupPath)) {
    renameSync(localEnvBackupPath, localEnvPath);
  }
}
