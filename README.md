# AI relay kit

Three things from the main PC, packaged so another Windows PC can have them with one command:

1. **Opus Relay** — a Claude Code skill plus five subagents for running a big task across agents.
2. **Relay** — the Codex skill that does the same job with GPT-6 Astra and GPT-6.1 Sol.
3. **Codex desktop repair** — a launcher that fixes the Codex desktop app hanging on its loading spinner / OpenAI logo, the missing model picker, and messages that stay queued and never send.

## Install on another PC

Paste this into PowerShell. No sign-in, git or GitHub tools needed:

```powershell
irm https://raw.githubusercontent.com/xtralargepizza/ai-relay-kit/main/get.ps1 | iex
```

It downloads the kit to `%USERPROFILE%\ai-relay-kit` and runs `install.ps1`. Run the same command again to update.

Restart Claude Code and Codex afterwards. Anything the installer replaces is moved to `%USERPROFILE%\.relay-kit-backups\<timestamp>` first.

Install only part of it with `-NoClaude`, `-NoCodexRelay`, `-NoCodexFix` or `-NoShortcuts`, for example:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/xtralargepizza/ai-relay-kit/main/get.ps1))) -NoCodexFix
```

## What lands where

| In this repo | Installed to | What it is |
|---|---|---|
| `claude/skills/opus-relay/` | `~/.claude/skills/opus-relay/` | The Opus Relay skill |
| `claude/agents/relay-*.md` | `~/.claude/agents/` | Scout, worker, builder, visual analyst, checker |
| `codex/skills/relay/` | `~/.codex/skills/relay/` | The Codex Relay skill |
| `codex-desktop-fix/` | `%LOCALAPPDATA%\Codex\` | Repair launcher, plus a "Codex (startup repair)" shortcut on the Desktop and Start menu |

## 1. Opus Relay (Claude Code)

Say "use Opus Relay for <task>" or run `/opus-relay`. The main Opus session orchestrates and does not do the work itself:

- It writes one `BRIEF.md` (the deliverable in the user's words, what does not count, time and round caps) and one `STATUS.json`.
- It sends short packets to subagents: `relay-scout` and `relay-worker` on Sonnet for lookups and known routes, `relay-builder` and `relay-visual` on Opus for new code and image judgment.
- A fresh `relay-checker` reviews the real output files, not the worker's summary.
- One item goes end to end before fan-out. Two failures of the same approach mean change the method. No more than two fix passes on one defect before going back to the user.

`references/failure-lessons.md` lists the concrete failures of the earlier Codex Relay and the rule that prevents each one. `scripts/check_execution.py STATUS.json` checks a batch's status file for stalls and miscounts.

The skill's last step mentions an Obsidian brain. On a PC without that vault, skip that step.

## 2. Relay (Codex)

Say "Use Relay for <task>" or `$relay <task>`. Astra writes one short brief and steps back, a Sol worker does the task, a Sol checker reviews milestones. "Complex Relay" (`references/complex-relay.md`) is the multi-workstream mode. It follows the same result-first rules as Opus Relay.

It expects the `gpt-6-astra` and `gpt-6.1-sol` models to be available to the Codex account on that PC.

## 3. Codex desktop repair

**Symptoms it addresses**

- The Codex desktop app opens to a spinner or the OpenAI logo and never shows the sidebar.
- The model picker is missing in some or all chats.
- A sent message sits in the queue and never reaches the model.

**What was found** (full write-up in `codex-desktop-fix/STARTUP-REPAIR.md`)

The app's local service starts and signs in, but the window sometimes never receives the startup state, so it waits forever. Clearing caches, resetting the web profile, reinstalling and disabling GPU did not fix it. Asking the app for its own startup snapshot again did. The same lost-reply problem later strands background "read" requests, and that is what hides the model picker and blocks the send queue.

**What the launcher does**

`Codex (startup repair)` starts Codex through `launch-codex-repaired.ps1`, which runs a small hidden Node helper connected to the app over a private pipe (no network port is opened). The helper:

1. re-requests the startup snapshot, up to four times, if the loading screen is still showing;
2. retries a stalled model list once the interface is up;
3. installs a watcher that re-sends stalled **read** requests after 30 seconds, at most three times each.

It never re-sends messages, turn starts, commands or settings writes, and it patches no app files, accounts or conversations.

**How to use it**

- Always open Codex with **Codex (startup repair)**. The normal Codex icon skips the repair. To put it on the taskbar, drag the shortcut there and unpin the old icon.
- If Codex is already stuck, quit it fully from the system tray first, then use the shortcut.
- Needs Node.js on PATH (`winget install OpenJS.NodeJS.LTS`) and the Microsoft Store version of Codex.
- Outcomes are logged to `%LOCALAPPDATA%\Codex\startup-repair.log` (no chat contents or credentials).

**Limits — read before trusting it on a new PC**

- Steps 1 and 2 use only stable app hooks and were restart-tested twice on desktop build `26.928.1915.0`.
- Step 3 (the read watcher, `recover-desktop-reads.js` and `seed-desktop-reads.mjs`) imports one internal bundle by exact name, `app-shared-6472dfc83b38.js`, and uses two minified names from it. On a different Codex build that file will not exist and the watcher does nothing — it fails closed and harmlessly, but queued messages will not be auto-recovered. Fixing that means opening the new build's `app-shared-*.js` and finding the new names for the fetch client (has `pendingRequests`) and the message bus (has `dispatchMessage`).
- The main PC is now on build `26.928.3736.0`; the watcher has not been re-verified on it.
- This is a workaround for an app bug, not a fix of the cause.

**Other things fixed in the same session**

- The `codex` terminal command was resolving to an old copy bundled with the VS Code extension. Fix: `npm install -g @openai/codex`, then make sure the npm folder comes before the VS Code one in the user PATH. Check with `codex --version`.
- The desktop app was on an old build and the Store showed no update. A forced Store reinstall delivered the new one.
- Do not set a model in `~/.codex/config.toml` that the desktop app's picker does not list yet; that made the app hang on the old build. Use `codex -m <model>` in the terminal instead until the picker shows it.

## For Claude or Codex reading this on a new PC

Run `install.ps1` from this folder, report what it printed (including any warnings about Node.js or the Codex version), and tell the user to restart Claude Code and Codex. Do not edit the user's `config.toml`, sign-in files or conversations. If the Codex version printed differs from `26.928.1915.0`, say that the stuck-message watcher may be inactive, per the limits above.
