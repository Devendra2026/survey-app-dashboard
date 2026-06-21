/**
 * Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local against Maps Static API.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(root, ".env.local");

let failed = false;

function fail(msg) {
  console.error(`[verify-google-maps-key] ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`[verify-google-maps-key] OK — ${msg}`);
}

function readEnv(key) {
  if (!existsSync(envPath)) {
    fail("Missing .env.local");
    return null;
  }
  const text = readFileSync(envPath, "utf8");
  const re = new RegExp(`^${key}=(.+)$`, "m");
  const raw = text.match(re)?.[1]?.trim();
  if (!raw) return null;
  return raw.replace(/^["']|["']$/g, "");
}

function printFixSteps() {
  console.log("\nFix in Google Cloud Console (same project as your API key):");
  console.log("  1. Enable billing: https://console.cloud.google.com/billing");
  console.log("  2. Enable APIs: Maps Embed API + Maps Static API");
  console.log("     https://console.cloud.google.com/google/maps-apis/api-list");
  console.log("  3. API key HTTP referrers (for browser embeds):");
  console.log("     http://localhost:3000/*");
  console.log("     https://*.vercel.app/*");
  console.log("     https://YOUR-PRODUCTION-DOMAIN/*");
  console.log("  4. Restart dev server after changing .env.local");
  console.log("  5. Re-run: npm run verify:google-maps-key\n");
}

async function main() {
  const key = readEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  if (!key) {
    fail("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in .env.local");
    printFixSteps();
    return 1;
  }

  ok(`Key present (${key.slice(0, 4)}…${key.slice(-4)})`);

  const testLat = 28.6139;
  const testLng = 77.209;
  const url =
    `https://maps.googleapis.com/maps/api/staticmap?center=${testLat},${testLng}` +
    `&zoom=14&size=200x200&markers=color:red%7C${testLat},${testLng}&key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { method: "GET" });
    const contentType = res.headers.get("content-type") ?? "";

    if (res.ok && contentType.startsWith("image/")) {
      ok("Maps Static API responded with an image");
      console.log("\nGoogle Maps key is valid for Static Maps (print/PDF maps).\n");
      return 0;
    }

    const body = await res.text();

    if (body.includes("enable Billing") || body.toLowerCase().includes("billing")) {
      fail("Billing is not enabled on this Google Cloud project");
      console.error("  Enable billing: https://console.cloud.google.com/billing/enable");
    } else if (body.includes("REQUEST_DENIED")) {
      fail("REQUEST_DENIED — check enabled APIs, billing, and key restrictions");
      if (body.includes("referer")) {
        console.error(
          "  Hint: HTTP referrer restrictions block server-side checks; maps may still work in the browser.",
        );
      }
    } else if (body.includes("OVER_QUERY_LIMIT")) {
      fail("OVER_QUERY_LIMIT — quota exceeded");
    } else {
      fail(`Unexpected response (${res.status}): ${body.slice(0, 240)}`);
    }
  } catch (err) {
    fail(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (failed) printFixSteps();
  return failed ? 1 : 0;
}

const code = await main();
process.exitCode = code;
