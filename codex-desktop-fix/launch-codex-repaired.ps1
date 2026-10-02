param([switch]$CaptureDiagnostic)
$ErrorActionPreference = 'Stop'
$codexPackage = Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
if (-not $codexPackage) { throw 'Codex desktop is not installed.' }
$codexExecutable = Join-Path $codexPackage.InstallLocation 'app\ChatGPT.exe'
$codexRunning = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'ChatGPT.exe' -and $_.ExecutablePath -eq $codexExecutable -and $_.CommandLine -notmatch '--type=' }
if ($codexRunning) {
    Start-Process -FilePath explorer.exe -ArgumentList 'shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App'
    exit
}
$codexNode = (Get-Command node.exe -ErrorAction Stop).Source
$codexLauncher = Join-Path $PSScriptRoot 'launch-codex-repaired.mjs'
$codexArguments = @(('"' + $codexLauncher + '"'), ('"' + $codexExecutable + '"'))
if ($CaptureDiagnostic) { $codexArguments += '--capture' }
Start-Process -FilePath $codexNode -ArgumentList $codexArguments -WindowStyle Hidden
