# Copy survey-backup.zip to EC2 for local import (avoids proxy truncation).
param(
  [Parameter(Mandatory = $true)]
  [string]$Ec2Host,
  [string]$ZipPath = (Join-Path $PSScriptRoot "..\survey-backup.zip"),
  [string]$RemotePath = "/tmp/survey-backup.zip"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ZipPath)) {
  Write-Error "ZIP not found: $ZipPath"
}

$sizeMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "Uploading $ZipPath ($sizeMb MB) to ${Ec2Host}:${RemotePath} ..."
Write-Host "This may take several minutes."

scp $ZipPath "${Ec2Host}:${RemotePath}"

Write-Host ""
Write-Host "Verify on EC2:"
Write-Host "  ls -lh $RemotePath"
Write-Host "  tar -tf $RemotePath | head"
Write-Host ""
Write-Host "Then import:"
Write-Host "  cd /path/to/sdv-front-new-app"
Write-Host "  ./convex-backups/import-selfhosted-ec2.sh $RemotePath"
