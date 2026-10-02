# One-command bootstrap: downloads the kit as a zip (no git or GitHub sign-in
# needed) and runs install.ps1. Switches are passed straight through.
param([switch]$NoClaude, [switch]$NoCodexRelay, [switch]$NoCodexFix, [switch]$NoShortcuts)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$destination = Join-Path $env:USERPROFILE 'ai-relay-kit'
$zip = Join-Path $env:TEMP 'ai-relay-kit.zip'
$unpacked = Join-Path $env:TEMP 'ai-relay-kit-unpacked'

Invoke-WebRequest 'https://github.com/xtralargepizza/ai-relay-kit/archive/refs/heads/main.zip' -OutFile $zip -UseBasicParsing
if (Test-Path $unpacked) { Remove-Item $unpacked -Recurse -Force }
Expand-Archive $zip $unpacked
New-Item -ItemType Directory -Force $destination | Out-Null
Copy-Item (Join-Path $unpacked 'ai-relay-kit-main\*') $destination -Recurse -Force
Remove-Item $zip, $unpacked -Recurse -Force

& (Join-Path $destination 'install.ps1') @PSBoundParameters
