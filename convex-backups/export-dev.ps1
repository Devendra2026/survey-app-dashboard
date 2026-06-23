$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
npx convex export --path "convex-backups/dev-$(Get-Date -Format 'yyyy-MM-dd-HHmm').zip" --include-file-storage
