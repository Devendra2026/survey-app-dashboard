# Build survey-backup-import.zip (drops generated_schema.jsonl sidecars).
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Src = Join-Path $Root "survey-backup.zip"
$Dst = Join-Path $Root "survey-backup-import.zip"

if (-not (Test-Path $Src)) { Write-Error "Missing $Src" }

Write-Host "Stripping generated_schema.jsonl from snapshot (may take several minutes)..."
python (Join-Path $PSScriptRoot "strip-generated-schema.py") $Src $Dst

Write-Host "Done: $Dst"
