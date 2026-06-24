import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Remove ` # comment` suffix; preserves `#` inside quoted values. */
function stripInlineComment(value) {
  let inQuote = false;
  let quote = "";
  for (let i = 0; i < value.length; i += 1) {
    const c = value[i];
    if (!inQuote && (c === '"' || c === "'")) {
      inQuote = true;
      quote = c;
    } else if (inQuote && c === quote) {
      inQuote = false;
    } else if (!inQuote && c === "#" && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i).trimEnd();
    }
  }
  return value.trim();
}

function unquote(value) {
  let val = value.trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return val.trim();
}

/** @param {string} filePath @returns {Record<string, string>} */
export function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = unquote(stripInlineComment(trimmed.slice(eq + 1)));
    if (!val) continue;
    out[key] = val;
  }
  return out;
}

/** @param {"local" | "production"} profile */
export function resolveWebEnvPath(root, profile = "local") {
  const fileName = profile === "production" ? ".env.production" : ".env.local";
  return join(root, fileName);
}

/** Load self-hosted Convex CLI env from a dotenv file into process.env. */
export function applyConvexSelfHostedEnv(envFilePath) {
  const parsed = parseEnvFile(envFilePath);
  const url = parsed.CONVEX_SELF_HOSTED_URL?.trim();
  const adminKey = parsed.CONVEX_SELF_HOSTED_ADMIN_KEY?.trim();
  if (url) process.env.CONVEX_SELF_HOSTED_URL = url;
  if (adminKey) process.env.CONVEX_SELF_HOSTED_ADMIN_KEY = adminKey;
  return { url, adminKey };
}
