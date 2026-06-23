# Convex snapshot export / import

Full snapshots include all application tables plus survey photos in `_storage`.

## Cloud deployments (Convex hosted)

```bash
npm run convex:export:dev
npm run convex:import:dev
npm run convex:export:prod
npm run convex:import:prod
```

## Self-hosted (Dokploy / AWS EC2)

**Do not import multi-GB ZIPs through the public reverse proxy** (`https://api.sdvedytech.in`). Upload truncation causes `invalid zip file`. Import on the EC2 host via `http://127.0.0.1:3210` instead.

### `generated_schema.jsonl` / `uniform` parse error

If import fails with `unexpected token at 'uniform'`, strip sidecar files first:

```bash
npm run convex:prepare:import-zip
# creates survey-backup-import.zip in project root
```

Then import `survey-backup-import.zip` instead of the raw export.

### One-shot on EC2 (recommended)

Your API host `api.sdvedutech.in` resolves to AWS EC2. **Import must run on that host** (SSH), not from Windows through the public URL.

1. Copy the ZIP to the server:

   ```powershell
   # From Windows (requires SSH key for ec2-user or ubuntu@)
   npm run convex:verify:zip
   npm run convex:import:ec2 -- -Ec2Host ubuntu@13.127.204.141 -RemoteProjectPath /path/to/sdv-front-new-app
   ```

   Or manually:

   ```powershell
   .\convex-backups\copy-to-ec2.ps1 -Ec2Host ubuntu@<ec2-ip>
   ```

2. SSH into EC2 and run:

   ```bash
   cd /path/to/sdv-front-new-app
   chmod +x convex-backups/import-selfhosted-ec2.sh
   ./convex-backups/import-selfhosted-ec2.sh /tmp/survey-backup.zip
   ```

From Windows (after `npm run convex:prepare:import-zip`):

```powershell
npm run convex:deploy:selfhosted
npx convex import --replace-all --yes .\survey-backup-import.zip
```

Or use the full script (auto-prepares ZIP if needed):

```powershell
npm run convex:import:selfhosted -Force
```

### Environment (`.env.local` on EC2)

```env
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<from: docker exec <backend> ./generate_admin_key.sh>
CLERK_JWT_ISSUER_DOMAIN=https://organic-halibut-21.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_...
```

### Post-import

| Step          | Action                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| Clerk webhook | Point to `<CONVEX_SITE_URL>/clerk-webhook` (HTTP actions, port 3211 internally) |
| Web / mobile  | `NEXT_PUBLIC_CONVEX_URL=https://api.sdvedutech.in` (rebuild after change)       |
| Verify        | `npx convex data` — expect ~3534 surveys, ~7020 photos                          |

### Dokploy / Traefik proxy limits (fallback only)

If you must import through the public URL, raise ingress body size and timeouts:

- `client_max_body_size` ≥ `2500m`
- `proxy_read_timeout` / `proxy_send_timeout` ≥ `7200s`
- Disable Cloudflare orange-cloud for the import window

### Expected row counts (`survey-backup.zip`)

| Table           | ~Rows  |
| --------------- | ------ |
| surveys         | 3,534  |
| photos          | 7,020  |
| floors          | 4,613  |
| users           | 36     |
| auditLogs       | 25,044 |
| \_storage files | 7,217  |
