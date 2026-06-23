$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$zip = if ($args[0]) { $args[0] } else { Get-ChildItem "convex-backups\*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName }
if (-not $zip) { Write-Error "No ZIP found. Pass path or place a .zip in convex-backups/" }
npx convex import --replace-all --yes $zip
