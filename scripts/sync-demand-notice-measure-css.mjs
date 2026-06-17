/**
 * Regenerates app/demand-notice-a4-measure.css from the print stylesheet.
 * Uses flat selectors (no nesting) for Turbopack / PostCSS compatibility.
 *
 * Run after editing demand-notice-a4-print.css:
 *   node scripts/sync-demand-notice-measure-css.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const printPath = path.join(root, "app/demand-notice-a4-print.css");
const measurePath = path.join(root, "app/demand-notice-a4-measure.css");

const src = fs.readFileSync(printPath, "utf8");
let inner = src
  .replace(/^\/\*[\s\S]*?\*\/\s*/, "")
  .replace(/^@media print \{\s*/, "")
  .replace(/\}\s*$/, "");
inner = inner.replace(/^\s*html,\s*\r?\n\s*body\s*\{[\s\S]*?\}\s*\r?\n/, "");
inner = inner.replace(/width: 210mm/g, "width: 100%");

const prefix = "html.dn-print-measure ";
const blocks = [];
let i = 0;
const len = inner.length;

while (i < len) {
  const comment = inner.slice(i).match(/^(\s*\/\*[\s\S]*?\*\/\s*)/);
  if (comment) {
    blocks.push(comment[1].trimEnd());
    i += comment[1].length;
    continue;
  }

  const rule = inner.slice(i).match(/^(\s*)([^{]+)\{/);
  if (!rule) {
    i++;
    continue;
  }

  const selectors = rule[2]
    .trim()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const start = i + rule[0].length;
  let depth = 1;
  let j = start;
  while (j < len && depth > 0) {
    if (inner[j] === "{") depth++;
    else if (inner[j] === "}") depth--;
    j++;
  }

  const body = inner.slice(start, j - 1).trimEnd();
  const prefixed = selectors.map((s) => prefix + s).join(",\n");
  blocks.push(`${prefixed} {\n${body}\n}`);
  i = j;
}

const out =
  "/* JS pre-print measure — flat selectors (auto-generated; do not edit by hand) */\n" +
  "/* Regenerate: node scripts/sync-demand-notice-measure-css.mjs */\n\n" +
  blocks.join("\n\n") +
  "\n";

fs.writeFileSync(measurePath, out);

let depth = 0;
for (const ch of out) {
  if (ch === "{") depth++;
  if (ch === "}") depth--;
}
if (depth !== 0) {
  console.error(`Brace mismatch in generated file (balance ${depth})`);
  process.exit(1);
}

console.log(`Wrote ${measurePath} (${out.split("\n").length} lines)`);
