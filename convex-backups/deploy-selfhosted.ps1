$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
npm install convex@latest
node ./scripts/deploy-backend-prod.mjs
