---
name: opus-relay
description: Result-first multi-agent orchestration for Claude Code. Opus orchestrates; Sonnet/Opus subagents at task-appropriate effort do the work; a fresh-context checker reviews actual artifacts. Use when the user invokes Opus Relay / relay, or asks to orchestrate a large task across agents.
---

# Opus Relay

The main session (Opus) is the **orchestrator**. It owns the path from request to delivered result: one brief, dispatch, decisions, verification of real outputs, and user communication. Workers do the work. A checker reviews what was actually produced. Invoking this skill authorizes the subagents and workflows it describes — not publishing, purchases, paid API spend beyond a user-stated budget, or messaging other people.

Read [references/failure-lessons.md](references/failure-lessons.md) once per task: it lists the concrete ways the previous Codex Relay failed and the rule that prevents each.

## 1. Before dispatch (orchestrator, ≤ 5 minutes)

Write `BRIEF.md` in the task folder. One file, updated in place; superseded instructions are deleted from it, not stacked in new correction files. Contents, ~300 words:

- **Deliverable in the user's words**, its evidence (file kinds, paths), and an explicit **does-not-count list** (previews, inventories, reports, AI mock pictures, old outputs relabeled).
- **Inputs** with verified paths; **protected** files; **owned output dirs** per worker.
- **Constraints with their source**: `user`, `domain-rule`, or `orchestrator-choice`. Never present an orchestrator choice as a user rule.
- **Budget** for paid calls only if the user stated one. Otherwise paid calls need a user decision.
- **Work budget**, always: a wall-time cap and a round cap for the whole task and for each worker (default: 90 minutes total, 6 build rounds per worker, 2 fix passes per defect). Write them in the brief and in every dispatch packet. When a cap is hit, stop, show the best result with its open defects, and ask — do not extend it yourself.
- **Stop conditions**: what is a genuine user decision vs. normal work the team must just do.

Create `STATUS.json` beside it with a `relay_execution` block (schema in [references/status-schema.md](references/status-schema.md)). Counts are kept separately: `prepared`, `intermediate`, `delivered`, `reviewed`.

**Trust inherited claims only after a test.** Earlier notes, receipts and "passed" labels are leads. Before the plan depends on one, run the smallest check that proves it (open the file, run the command once, view the image). Record results in `VERIFIED.md`: claim → test → verified / failed / untested.

## 2. Team sizing and model routing

Use the subagent types installed with this skill (`~/.claude/agents/relay-*.md`). If they are not loaded in the current session, use `general-purpose` with the `model` parameter and state the intended effort in the prompt.

| Role | Agent type | Model / effort | Use for |
|---|---|---|---|
| Scout | `relay-scout` | Sonnet, low | Finding files, listing, copying, mechanical extraction, running known commands |
| Worker | `relay-worker` | Sonnet, medium | Executing an established route, batch processing, rendering, data tables |
| Builder | `relay-builder` | Opus, high | New code, geometry/UV math, debugging a broken route, hard diagnosis |
| Visual analyst | `relay-visual` | Opus, high | Looking at images and judging construction, fit, cut, shading |
| Checker | `relay-checker` | Opus, high | Independent review of delivered artifacts; read-only on production files |

Start small. One representative item goes **end to end** before fan-out. Then parallelize independent items, one writer per output directory. Respect shared limits (GPU renders ≤ 2 concurrent, one owner per external app). More agents do not speed up a serial prerequisite. Use the `Workflow` tool for deterministic fan-out of ≥ 5 uniform items once the route is proven.

## 3. Dispatch packet (≤ 250 words + paths)

Every worker prompt contains: goal and the exact deliverable; inputs (paths); owned output dir; the verified commands to use; acceptance evidence; what not to do (from the failure lessons that apply); the return format:

```
STATUS: delivered | blocked-external | needs-decision | failed
ARTIFACTS: <paths>
EVIDENCE: <what was checked and how>
OPEN: <exact defect or question, smallest next action>
```

Workers return that block as their final message (the harness blocks subagents from writing report .md files); the orchestrator records it in the task folder. Workers fix their own obvious errors (wrong path, wrong flag) immediately. They do not return normal implementation work as a "missing prerequisite". They never fabricate approvals, authorization files or passes.

## 4. Orchestrator loop

- Run workers in the background and **wait for notifications**. Do not poll, do not reread history, do not redo a worker's job.
- On each return: **open the actual artifact** (view the image, read the file) before reporting or counting it. A worker's "done" is a claim.
- Send the first real deliverable to the user as soon as it exists, with an honest verdict. Then continue.
- A defect in one item does not freeze the batch. One owner fixes it; other workers continue on independent items.
- **Two-failure rule.** Two failures of the same approach — across any items — means stop that approach, diagnose the shared cause, and change the mechanism. A new item ID, resolution or adjectives in a prompt do not count as a change.
- **No open-ended fix loops.** A checker's defect list buys at most two fix passes. If the same region still fails, stop and bring the user the best result plus two or three different approaches (run them as short parallel trials when cheap) instead of a third pass. Taste questions go to the user early, before polishing.
- Paid/external jobs: keep receipts; reconcile uncertain outcomes (e.g. HTTP 5xx after submit) before any retry; never blind-resubmit.
- After a status-changing event, update `STATUS.json` and, for ≥ 4 items, run `python ~/.claude/skills/opus-relay/scripts/check_execution.py STATUS.json`. Act on its findings.

## 5. Checker

Spawn fresh (no inherited conclusions). Give it the artifacts, the reference/source, and the acceptance criteria — not the worker's narrative. It returns `pass` or `defect: <evidence> → <smallest correction> → <acceptance condition>`. Only blocking defects count; it separates them from polish. It reviews only what changed after a correction. The worker that produced an output fixes it; the checker does not edit production files.

## 6. User communication

- Short factual updates: what exists now (paths/images), what is running, what needs the user.
- Ask the user only for genuine decisions: spending, scope changes, taste/approval, or conflicting instructions. Ask once, with options.
- Never say something started, finished or passed without having observed it. If a tool call failed, say so.
- Final report: delivered artifacts, review verdicts, limits, and elapsed wall time if measured.

## 7. Finish

Update `STATUS.json` and `BRIEF.md` to the final state. Save durable project knowledge to the Obsidian brain (project note), committing only task-owned files. Stop workers that are no longer needed.
