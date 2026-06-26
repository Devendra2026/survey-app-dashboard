/**
 * Run a command with `.env.production` applied to process.env.
 *
 * Next.js loads `.env.local` during `next build` and it overrides `.env.production`.
 * Variables already in process.env win over dotenv files, so production builds must
 * be started through this wrapper (see `npm run build:prod`).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyConvexSelfHostedEnv, parseEnvFile, resolveWebEnvPath } from "./read-env-file.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolveWebEnvPath(root, "production");

if (!existsSync(envPath)) {
  console.error("[with-production-env] Missing .env.production");
  process.exit(1);
}

const prod = parseEnvFile(envPath);
for (const [key, value] of Object.entries(prod)) {
  process.env[key] = value;
}
applyConvexSelfHostedEnv(envPath);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
if (!convexUrl) {
  console.error("[with-production-env] NEXT_PUBLIC_CONVEX_URL missing in .env.production");
  process.exit(1);
}

console.log(`[with-production-env] NEXT_PUBLIC_CONVEX_URL=${convexUrl}`);
if (convexUrl.includes(".convex.cloud")) {
  console.error(
    "[with-production-env] Refusing to run: production env still points at Convex Cloud. Set https://api.sdvedutech.in in .env.production.",
  );
  process.exit(1);
}

const cmd = process.argv.slice(2);
if (cmd.length === 0) {
  console.error("[with-production-env] Usage: node ./scripts/with-production-env.mjs <command> [args...]");
  process.exit(1);
}

const result = spawnSync(cmd[0], cmd.slice(1), {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
