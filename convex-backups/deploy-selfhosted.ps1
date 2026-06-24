$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
npm install convex@latest
npx convex deploy --yes
node ./scripts/sync-clerk-issuer.mjs --prod
