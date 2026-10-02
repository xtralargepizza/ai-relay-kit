# Codex startup workaround — 2026-09-30

Use **Codex (startup repair)** on the Desktop or Start menu. The existing
`Open_Codex_Fix.bat` and `Launch Codex - Safe Graphics.cmd` now use this launcher.
Their previous contents are preserved in the dated `launcher-backups-*` folder.

## Finding

Desktop build 26.928.1915.0 starts its local service and authenticates successfully,
but the renderer can remain unaware of the local service's connection and version.
During the reproduced freeze the renderer showed local state `disconnected` and
version `null`, while its durable connection was connected and host logs confirmed
local initialization. The onboarding gateway readiness check consequently stayed
`loading`. Requesting the app's own initialization snapshot again populated the
local version (0.159.0) and allowed the main interface to load.

This identifies a missed initialization-state delivery; the exact upstream timing
defect has not been proven. It is not evidence that a model setting caused the freeze.

## Workaround

`launch-codex-repaired.ps1` resolves the currently installed Store package and
launches `launch-codex-repaired.mjs` in a hidden Node process. The helper uses an
inherited Chromium debugging pipe, with no TCP listener. If the startup logo is
still displayed, it requests the existing `ready` / `initializationOnly` handshake,
up to four times. It detaches its diagnostic session once the sidebar appears.
The pipe and hidden helper stay alive until the desktop app exits.

No app binaries, account files, conversations, or model configuration are patched.
The regular packaged-app icon does not run this workaround. If the app was opened
through that icon and is stuck, quit it fully from the tray before using the repair
shortcut. If it is already running, the shortcut brings it forward.

## Verification

- First full launch: PID 37932. One retry, interface ready in about 12 seconds.
  App log independently reported `app_start outcome=success`, with shell, home,
  and sidebar readiness marks.
- Second full launch: PID 28260. One retry, interface ready in about 12 seconds.
  Screenshot checked: sidebar, composer, saved projects, and Your dot visible.
- The earlier temporary TCP debugger on port 9228 was closed.

`startup-repair.log` records outcomes without chat contents or credentials.
`startup-repair-verified.png` is the one diagnostic screenshot from verification;
normal launches do not capture screenshots.

This is a tested startup workaround, not a replacement for an upstream app fix.

## Missing model selector follow-up

On 2026-09-30, the running app also had a pending local `model/list` query while
the durable catalog had succeeded. Retrying only that read restored the visible
model selector without restarting the app or changing the selected model. Both
catalogs then included GPT-6.1 Sol. The launcher now also retries a pending local
model catalog once, three seconds after the main interface becomes ready. This
launcher addition was syntax checked; the equivalent live refresh was verified.

## Settings shared across chats

Some model settings remained blocked on coalesced `config/read` requests from
startup. Query-cache refreshes reused those same pending requests. Re-dispatching
four stale configuration reads with their original request IDs allowed the real
backend responses to resolve all dependent settings queries. Multiple open chats
then rendered their model selectors, and no pending config queries remained.

`recover-chat-settings.js` now checks for these stale reads every 15 seconds while
the renderer is open. It retries each read once, only after 30 seconds, only for
local/durable hosts, and only for `config/read`. It does not change config values,
models, permissions, authentication, messages, or running turns. The same helper
was installed into the running app without restarting it. The launcher installs
it on future starts. This remains a workaround for the app's request delivery issue.

## Messages remaining queued (2026-09-30)

The queued opacity message was locally accepted with status `pending`, while its
thread was idle. There was no corresponding pending `turn/start`. Two shared
`vscode://codex/codex-home` reads were stranded. Re-dispatching those exact read
envelopes with their original IDs unblocked submission: the original message ID
became the thread's latest turn-start message ID, the queue emptied, and the turn
ran and returned to idle. The user also confirmed a different chat sends and replies.

Fourteen other stranded read envelopes were recovered with actual backend replies.
This is a shared request-delivery failure, not evidence of a particular broken chat
or model. The underlying upstream cause of lost replies remains unproven.

`recover-desktop-reads.js` replaces the narrow config-read watcher. It observes
outgoing request metadata and retries a strict allowlist of local/settings/catalog
reads after 30 seconds, at most three times per pending request. It preserves the
original request IDs and parameters. It never replays messages, turn starts,
commands, configuration writes, or send-lock operations. Completed/canceled reads
are removed from tracking. Captured envelopes are retained only in renderer memory.

The repaired launcher now installs the observer before the initialization retry.
`seed-desktop-reads.mjs` identifies exact pending fetch envelopes emitted before
attachment and passes them through the same read allowlist. The helper intentionally
targets the inspected 26.928.1915.0 bundle; a future app build may need a new review.

Verified without closing the app: original message unblocked; another chat works
(user confirmed); fourteen old reads resolved; watcher reported no errors.
Regression checks passed for the stale-read delay, exact ID/parameter preservation,
completed-read cleanup, mutation exclusion, three-retry limit, and reversible removal.
Launcher files passed syntax checks. A full restart of this latest launcher revision
was not performed because the user asked to keep the app open.
