# Self-hosted Convex import from Windows.
# For multi-GB ZIPs, prefer EC2 script: convex-backups/import-selfhosted-ec2.sh
param(
  [string]$ZipPath = (Join-Path $PSScriptRoot "..\survey-backup-import.zip"),
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Test-Path $ZipPath)) {
  $fallback = Join-Path $PSScriptRoot "..\survey-backup.zip"
  if (Test-Path $fallback) {
    Write-Host "Building survey-backup-import.zip (strip generated_schema.jsonl)..."
    & (Join-Path $PSScriptRoot "prepare-import-zip.ps1")
  } else {
    Write-Error "ZIP not found: $ZipPath"
  }
}

$zipItem = Get-Item $ZipPath
Write-Host "ZIP: $($zipItem.FullName) ($([math]::Round($zipItem.Length / 1MB, 2)) MB)"

$envFile = Join-Path $Root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error "Missing .env.local. Copy from .env.selfhosted.example"
}

$envContent = Get-Content $envFile -Raw
$urlMatch = [regex]::Match($envContent, '(?m)^CONVEX_SELF_HOSTED_URL=(.+)$')
$selfHostedUrl = $urlMatch.Groups[1].Value.Trim().Trim('"').Trim("'")

if ($selfHostedUrl -match '^https://' -or $selfHostedUrl -match 'api\.') {
  Write-Warning @"
CONVEX_SELF_HOSTED_URL is public ($selfHostedUrl).
Imports over ~100MB often fail with 'invalid zip file' through reverse proxies.
Run on EC2 instead:
  scp survey-backup.zip ec2-user@<host>:/tmp/
  ./convex-backups/import-selfhosted-ec2.sh /tmp/survey-backup.zip
"@
  if (-not $Force) {
    $confirm = Read-Host "Continue anyway? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') { exit 1 }
  } else {
    Write-Warning "Force: continuing import through public URL."
  }
}

Write-Host "=== npm install convex@latest ==="
npm install convex@latest

Write-Host "=== npx convex deploy --yes ==="
npx convex deploy --yes

Write-Host "=== Sync Clerk env ==="
node ./scripts/sync-clerk-issuer.mjs

Write-Host "=== npx convex import --replace-all ==="
npx convex import --replace-all --yes $zipItem.FullName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== npx convex data ==="
npx convex data

Write-Host "Import finished."
