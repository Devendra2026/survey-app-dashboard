# Verify survey-backup.zip before upload to EC2.
param(
  [string]$ZipPath = (Join-Path $PSScriptRoot "..\survey-backup.zip")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ZipPath)) {
  Write-Error "ZIP not found: $ZipPath"
}

$item = Get-Item $ZipPath
$sizeMb = [math]::Round($item.Length / 1MB, 2)
Write-Host "OK: $($item.FullName)"
Write-Host "Size: $sizeMb MB (expect ~1914 MB)"

$listing = & tar -tf $ZipPath 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error "tar could not read ZIP: $listing" }
$sample = $listing | Select-Object -First 8
Write-Host "Sample entries:"
$sample

$required = @("README.md", "surveys/documents.jsonl", "_storage/documents.jsonl")
foreach ($entry in $required) {
  if (-not ($listing -contains $entry)) { Write-Error "Missing expected entry: $entry" }
  Write-Host "OK: $entry"
}

Write-Host ""
Write-Host "ZIP is valid. Upload with:"
Write-Host "  npm run convex:import:ec2 -- -Ec2Host ec2-user@<ec2-ip>"
