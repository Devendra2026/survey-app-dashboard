#!/usr/bin/env bash
# Full self-hosted restore on EC2: deploy schema/functions, sync Clerk env, import snapshot.
# Usage: ./convex-backups/import-selfhosted-ec2.sh [/path/to/survey-backup.zip]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${1:-/tmp/survey-backup-import.zip}"
FALLBACK="/tmp/survey-backup.zip"

cd "$ROOT"

if [[ ! -f "$ZIP" && -f "$FALLBACK" ]]; then
  echo "Building import ZIP without generated_schema.jsonl..."
  python3 "$(dirname "$0")/strip-generated-schema.py" "$FALLBACK" "$ZIP"
fi

if [[ ! -f "$ZIP" ]]; then
  echo "ERROR: ZIP not found: $ZIP"
  echo "Copy from Windows: scp survey-backup.zip ec2-user@<host>:/tmp/survey-backup.zip"
  exit 1
fi

echo "=== Verify ZIP ==="
ls -lh "$ZIP"
tar -tf "$ZIP" | head -5
echo "..."

if [[ ! -f .env.local ]]; then
  echo "ERROR: Missing .env.local in $ROOT"
  echo "Set CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 and CONVEX_SELF_HOSTED_ADMIN_KEY"
  exit 1
fi

# Force localhost for import on EC2 (avoid public proxy truncation)
export CONVEX_SELF_HOSTED_URL="${CONVEX_SELF_HOSTED_URL:-http://127.0.0.1:3210}"
if [[ "$CONVEX_SELF_HOSTED_URL" == https://* ]] || [[ "$CONVEX_SELF_HOSTED_URL" == http://*api.* ]]; then
  echo "WARN: Overriding CONVEX_SELF_HOSTED_URL to http://127.0.0.1:3210 for import"
  export CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
fi

if [[ -z "${CONVEX_SELF_HOSTED_ADMIN_KEY:-}" ]]; then
  # shellcheck disable=SC1091
  set -a
  source <(grep -E '^CONVEX_SELF_HOSTED_' .env.local | sed 's/\r$//')
  set +a
fi

if [[ -z "${CONVEX_SELF_HOSTED_ADMIN_KEY:-}" ]]; then
  echo "ERROR: CONVEX_SELF_HOSTED_ADMIN_KEY not set in environment or .env.local"
  exit 1
fi

echo "=== Install Convex CLI (streaming import for large ZIPs) ==="
npm install convex@latest

echo "=== Deploy schema + functions ==="
npx convex deploy --yes

echo "=== Sync Clerk env to deployment ==="
node ./scripts/sync-clerk-issuer.mjs

echo "=== Import snapshot (this may take 15–45+ minutes) ==="
npx convex import --replace-all --yes "$ZIP"

echo "=== Done. Verify row counts ==="
npx convex data
