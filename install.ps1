# Installs the relay kit on this PC. Safe to re-run: anything it replaces is
# moved to %USERPROFILE%\.relay-kit-backups\<timestamp> first.
param(
    [switch]$NoClaude,      # skip the Claude Code Opus Relay skill + agents
    [switch]$NoCodexRelay,  # skip the Codex Relay skill
    [switch]$NoCodexFix,    # skip the Codex desktop startup/stuck-message repair
    [switch]$NoShortcuts    # install the repair files but create no shortcuts
)
$ErrorActionPreference = 'Stop'
$kit = $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $env:USERPROFILE ".relay-kit-backups\$stamp"

function Backup-Existing($path) {
    if (-not (Test-Path $path)) { return }
    $target = Join-Path $backupRoot ($path -replace '[:\\]+', '_')
    New-Item -ItemType Directory -Force $backupRoot | Out-Null
    Move-Item $path $target
    Write-Host "  backed up existing $path"
}

function Install-Folder($source, $destination) {
    Backup-Existing $destination
    New-Item -ItemType Directory -Force (Split-Path $destination) | Out-Null
    Copy-Item $source $destination -Recurse
    Write-Host "  installed $destination"
}

function Install-File($source, $destinationFolder) {
    New-Item -ItemType Directory -Force $destinationFolder | Out-Null
    $destination = Join-Path $destinationFolder (Split-Path $source -Leaf)
    Backup-Existing $destination
    Copy-Item $source $destination
    Write-Host "  installed $destination"
}

if (-not $NoClaude) {
    Write-Host 'Claude Code: Opus Relay skill and relay agents'
    Install-Folder (Join-Path $kit 'claude\skills\opus-relay') (Join-Path $env:USERPROFILE '.claude\skills\opus-relay')
    Get-ChildItem (Join-Path $kit 'claude\agents') -Filter 'relay-*.md' | ForEach-Object {
        Install-File $_.FullName (Join-Path $env:USERPROFILE '.claude\agents')
    }
}

if (-not $NoCodexRelay) {
    Write-Host 'Codex: Relay skill'
    Install-Folder (Join-Path $kit 'codex\skills\relay') (Join-Path $env:USERPROFILE '.codex\skills\relay')
}

if (-not $NoCodexFix) {
    Write-Host 'Codex desktop: startup repair launcher'
    $fixFolder = Join-Path $env:LOCALAPPDATA 'Codex'
    Get-ChildItem (Join-Path $kit 'codex-desktop-fix') -File | ForEach-Object {
        Install-File $_.FullName $fixFolder
    }

    if (-not $NoShortcuts) {
        $shell = New-Object -ComObject WScript.Shell
        $powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
        $launcher = Join-Path $fixFolder 'launch-codex-repaired.ps1'
        $folders = @(
            [Environment]::GetFolderPath('Desktop'),
            (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs')
        )
        foreach ($folder in $folders) {
            $shortcut = $shell.CreateShortcut((Join-Path $folder 'Codex (startup repair).lnk'))
            $shortcut.TargetPath = $powershell
            $shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $launcher + '"'
            $shortcut.WorkingDirectory = $fixFolder
            $shortcut.Save()
            Write-Host "  shortcut: $folder\Codex (startup repair).lnk"
        }
    }

    # The launcher needs these two things; report instead of failing the install.
    if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
        Write-Warning 'Node.js is not on PATH. The repair launcher needs it: winget install OpenJS.NodeJS.LTS'
    }
    $codex = Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
    if (-not $codex) {
        Write-Warning 'Codex desktop (Microsoft Store package OpenAI.Codex) is not installed on this PC.'
    } else {
        Write-Host "  Codex desktop version here: $($codex.Version) (repair was written against 26.928.1915.0)"
    }
}

Write-Host ''
Write-Host 'Done. Restart Claude Code / Codex so they pick up the new skills.'
if (Test-Path $backupRoot) { Write-Host "Replaced files were saved in $backupRoot" }
