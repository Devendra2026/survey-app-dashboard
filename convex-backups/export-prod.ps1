$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
npx convex export --prod --path "convex-backups/prod-$(Get-Date -Format 'yyyy-MM-dd-HHmm').zip" --include-file-storage
