# Copy ZIP to EC2 and run import-selfhosted-ec2.sh over SSH (avoids proxy truncation).
param(
  [Parameter(Mandatory = $true)]
  [string]$Ec2Host,
  [string]$RemoteProjectPath = "~/sdv-front-new-app",
  [string]$ZipPath = (Join-Path $PSScriptRoot "..\survey-backup.zip"),
  [string]$RemoteZip = "/tmp/survey-backup.zip"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

& (Join-Path $PSScriptRoot "copy-to-ec2.ps1") -Ec2Host $Ec2Host -ZipPath $ZipPath -RemotePath $RemoteZip

Write-Host "=== SSH: verify ZIP on EC2 ==="
ssh $Ec2Host "ls -lh $RemoteZip && tar -tf $RemoteZip | head -3"

Write-Host "=== SSH: run import (15–45+ min) ==="
ssh $Ec2Host "cd $RemoteProjectPath && chmod +x convex-backups/import-selfhosted-ec2.sh convex-backups/prep-ec2.sh && ./convex-backups/import-selfhosted-ec2.sh $RemoteZip"

Write-Host "Done. Run locally: npm run convex:post-import:selfhosted"
