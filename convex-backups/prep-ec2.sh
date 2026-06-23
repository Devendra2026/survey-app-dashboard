#!/usr/bin/env bash
# Run on the EC2 host (SSH) before import. Read-only checks + admin key reminder.
set -euo pipefail

echo "=== Disk space (need >= 8 GB free) ==="
df -h / /tmp 2>/dev/null || df -h

echo ""
echo "=== Docker / Convex backend containers ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null | grep -i convex || docker ps

BACKEND="$(docker ps --format '{{.Names}}' | grep -iE 'convex.*backend|backend' | head -1 || true)"
if [[ -z "${BACKEND}" ]]; then
  echo "WARN: Could not auto-detect convex backend container name."
  echo "Find it in Dokploy and run: docker exec -it <name> ./generate_admin_key.sh"
else
  echo ""
  echo "Detected backend container: ${BACKEND}"
  echo "Generate admin key:"
  echo "  docker exec -it ${BACKEND} ./generate_admin_key.sh"
fi

echo ""
echo "=== Local backend reachability (:3210) ==="
if curl -sf -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:3210/ 2>/dev/null | grep -qE '^[0-9]+$'; then
  echo "OK: http://127.0.0.1:3210 responds"
else
  echo "WARN: http://127.0.0.1:3210 not reachable from this host."
  echo "If CLI runs inside Docker network, set CONVEX_SELF_HOSTED_URL to the internal service URL."
fi

echo ""
echo "Next: copy survey-backup.zip to /tmp, then run convex-backups/import-selfhosted-ec2.sh"
