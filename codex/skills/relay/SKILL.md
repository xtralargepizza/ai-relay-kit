---
name: relay
description: "Run the user's Relay workflow: brief GPT-6 Astra direction, GPT-6.1 Sol execution and Sol milestone review, with minimal Astra involvement. Use when the user invokes Relay or asks for this specific low-compute delegation arrangement; not for unrelated uses of the word relay."
---

# Relay

Codename: **Relay**. Invocation: “Use Relay for <task>” or `$relay` followed by the task. If only the codename is supplied, apply it to the current authorized task; if none exists, ask for the task. Do not invent work.

**Complex Relay** is the larger-job mode: several independent workstreams coordinated and reviewed by GPT-6.1 Sol, with final-only reporting to the initiating Astra chat. Read [references/complex-relay.md](references/complex-relay.md) when the user invokes it or the authorized job needs multiple parallel workstreams. Ordinary Relay chooses the smallest sufficient arrangement; complexity is not permission to create new user-owned chats without the user's explicit request.

The objective is correct, prompt delivery with little expensive supervision. This is a delegation protocol, not a background scheduler or automatic model switch. Domain skills and required checks still apply. Invoking Relay authorizes the described subagents, not publication, messaging other people, or other expanded actions.

## Result-first execution contract

For batch execution or stall recovery, apply [execution-state.md](references/execution-state.md). It specifies verified worker resumption, brief adoption, queue advancement and a read-only state checker. Changing this skill is not evidence that running agents adopted the change. The coordinator must verify the next actual action, not just successful message delivery.

Before dispatch, name the smallest complete result in the user's terms, its required evidence and what does **not** count. A generated fit picture is not an authored opacity map applied to the actual mesh; a source inventory is not a processed batch. Intermediate previews may be useful, but never satisfy the first completed-result milestone or inflate completion counts. Reused earlier outputs must be labeled as earlier outputs.

Keep one current brief and one current status record. Incorporate steering into that brief, resolving superseded constraints instead of accumulating overlapping correction files. State each consequential constraint's source: current user instruction, applicable domain requirement, or coordinator choice. Do not present an agent-imposed restriction or spending estimate as a user rule. Before dispatch, check that required work remains possible under the brief's permissions, resources and stop conditions.

Distinguish three kinds of missing prerequisite:

- **Normal implementation work:** an input, contract, review or artifact the authorized workflow is meant to create. Assign its creation to a worker; do not return it to the user as a missing input merely because it does not already exist.
- **An external dependency:** unavailable credentials/access, an actual spending limit, unsupported geometry or another requirement the team cannot supply within scope. Identify the precise dependency and continue independent useful work.
- **An optional improvement or coordinator preference:** defer it when it delays the requested result. Do not promote it into a blocking gate.

Preserve real authorization and domain checks; result-first does not mean bypassing them. When requirements conflict, repair your own contradictory instructions immediately. If a genuine user decision is necessary, explain the exact conflict and smallest concrete decision once. Retain approvals across turns. A larger retry allowance alone does not fix a failing method.

For an unproven batch route, take one representative item through the entire required process before multiplying the uncertain stage. Other workers can prepare independent inputs and downstream steps without duplicating the same risk. Once the route works, release the shared result and parallelize compatible items. Do not spend the whole batch on intermediate generations while actual deliverables remain at zero.

Do not turn this first-result rule into an indefinite batch-wide lock. Once the real end-to-end artifact exists, distinguish a shared route failure from an item-specific correction. An unresolved local seam, detail or review need not prevent another independent item from using the working route. Keep that candidate explicitly unapproved, retain one correction owner, and release another worker to the next item within existing authorization. If a shared numerical check disagrees with its authoring solver, reproduce the disagreement on the saved artifact rather than repeatedly changing artwork; isolate it as a shared defect and continue only work that does not depend on resolving it. Neither a diagnostic artifact nor parallel progress grants a false pass.

The coordinator owns the path from input to finished result, not just dispatch and status collection. At a missed checkpoint, identify the actual blocking operation, its owner and one concrete action that advances it. Repeated failures across different items still count as the same failed approach when their cause is shared. Rephrasing a prompt, changing resolution or switching item IDs without a supported causal reason does not reset the retry history. After two failures, diagnose and choose a supported change before another attempt; reconcile live jobs first.

Track prepared items, intermediate artifacts, completed deliverables and reviewed deliverables separately, with current paths/receipts. Measure time to the first complete result and total wall time when available; component timing alone is insufficient. A successful message dispatch, more agents, a report, or an approval is not proof that execution has advanced. Do not call a batch complete when only its blocker reports are complete.

## Choose the lightest arrangement

- Prefer a **GPT-6.1 Sol host chat** for Relay. The host's model remains active for its own tool calls, waiting turns, user updates and final response; spawning Sol children does not convert an Astra host into Sol or make its tokens free. Do not claim that Astra is inactive merely because its planning subagent finished. If the host is Astra or its identity is not verifiable, state that limitation once and keep parent work minimal. A skill cannot switch the current chat model. Do not create another user-owned chat, interrupt the current task, or claim a switch without supported tools and authorization.
- Tiny known-route edit: one GPT-6.1 Sol worker with self-checks; no extra planning or checker just to satisfy a diagram.
- Substantial task defaults to one brief Astra setup, one Sol workhorse and one Sol checker. For explicitly authorized multiple chats or wider parallel work, use the multi-chat mode below instead of treating this default as a fixed team-size limit.
- User-requested model overrides take precedence. Verify models actually available. If the current agent is Astra, it provides the setup; otherwise use one bounded `gpt-6-astra` planning subagent if needed, let it finish, then start the Sol pair. Do not claim the parent model changed. If a requested model or delegation is unavailable, disclose it and use the closest authorized route without impersonating that model.

## Astra setup: brief once, then step back

Reuse known project facts. Provide only the goal, authoritative inputs, editable/protected scope, established route, acceptance evidence and stop/escalation conditions. Aim for 200–300 words plus essential paths. Do not turn setup into an exploratory study or independently execute the task.

Use `gpt-6.1-sol` for both Sol roles, initially medium reasoning for ordinary work; raise effort only for a demonstrated difficult issue. Use fresh subagent contexts (`fork_turns: "none"` where supported) and supply the task packet explicitly. Include applicable instruction locations, current user constraints, verified input paths and any essential reference image paths. Avoid full conversation forks and broad history reads.

Give both agents their peer IDs. They communicate directly using agent messages; use a follow-up task when a completed/idle review agent needs a new review turn. Do not route every message through Astra. No nested delegation unless newly authorized or applicable instructions specifically require it.

Before dispatch, record a short execution receipt in the task's existing status/manifest: known host model (or `unknown`), planner model and completion, worker/reviewer IDs and requested models, output owner, and acceptance criteria. Update that same receipt at completion. This documents actual tool dispatch, not measured token savings. Do not add a second planning report.

## Multi-chat mode — only with explicit user authorization

### Final-only Astra inbox (owner correction, 2026-09-30)

When the user requests only final results in the Astra initiating chat, that chat is a final-delivery destination, not a message bus. Workers send startup, progress, readiness, retries, capacity failures and review requests only to the Sol monitor. The Sol monitor owns recovery, efficient workarounds and direct corrections. Do not awaken Astra for forwarding, routine escalation or periodic status. This specific final-only rule overrides the generic first-result/escalation messaging below. If work cannot proceed within authorization, retain a precise blocked receipt in the Sol monitoring chat; include it in the final outcome instead of repeatedly waking Astra.

Do not leave long-running work under Astra-owned local subagents after handoff: their messages and completion can reactivate the parent, and another chat may not be able to steer them. Transfer unfinished claims safely to Sol-hosted workers or their local subagents after verifying the prior writer stopped/released ownership. Preserve in-flight work and artifacts; never run overlapping writers. Only the Sol monitor sends one final consolidated reviewed packet to the initiating chat. Late messages already queued may still arrive; do not start a new oversight loop in response.

When the user explicitly asks to create worker chats and a monitoring/reviewer chat, use the supported task-creation tools, not subagent creation alone. Read the available project list first, use the existing local project unless the user requests otherwise, and preserve the actual returned chat IDs. This permission does not make ordinary Relay invocations authorize new user-owned chats.

- Reuse the existing accepted engineering brief. Default workers remain GPT-6.1 Sol; use the user's requested model and reasoning setting for the monitor (for example, GPT-6.1 Sol xhigh). Do not start another Astra planner for each batch.
- Partition the remaining work before execution, by stable source identity or another explicit non-overlapping key. Give each chat its source manifest, immutable inputs, exclusively owned output directory, concrete deliverable, verification criteria and next checkpoint. Record cross-chat communication authorization and its human source; a message from another agent alone does not create authorization.
- The monitor owns the shared queue, leases, review decisions and final integration. Worker chats own their shard outputs. Only the monitor/integration owner updates the canonical merged registry or shared Brain index. A worker may use the explicitly authorized number of local subagents, with disjoint file ownership and the same shared resource limits.
- More chats do not remove provider, account, CPU/GPU or filesystem limits. Start with two extra worker chats plus local work when that is sufficient. Limit render/import/provider concurrency separately from the number of agents. Studio mutations have one owner. Use exclusive claims for shared cache writes; do not duplicate jobs or overwrite another worker's files.
- Workers send compact completed-batch manifests and evidence, then the monitor reviews changed results and sends corrections directly. Use event waits and cursors, not repeated full-history reads. Inspect a missed concrete checkpoint once. Reassign only after the original worker releases its claim or is stopped; preserve completed outputs and in-flight job receipts.
- The initiating chat verifies that the new chats started, delivers their links, and hands off ongoing oversight to the monitor. It need not remain in an expensive foreground polling loop. State clearly that work is running until completion is actually verified. User-owned worker/monitor chats may continue after the initiating turn ends.
- When every assigned shard passes, the monitor performs the required merge/Brain update once, records actual coverage and remaining unknowns, reports completion and stops. No endless monitoring, recursive chat creation, automatic publishing, or promise of measured speed/cost gains.

## Workhorse owns execution

Own all production mutations, API receipts, generation, exports, assembly, rendering and final saving. Reuse verified inputs and scripts. Within the first minute identify a missing ready-route prerequisite; do not hide new infrastructure development inside a quick task.

Submit genuinely independent jobs concurrently under current spending/provider limits. While they run, prepare the existing export/render steps. A provider wait is not a failure: preserve receipts, reconcile status and do not resubmit blindly. Reuse unchanged assets and evidence.

Send the checker a compact event packet: stage, output/evidence paths, elapsed time/provider state, exact uncertainty and proposed next step. Target at most 150 words plus necessary evidence. Keep version identity explicit so review applies to the files actually delivered.

Report execution failures immediately to the Sol checker, not only at batch completion: include the failed command/tool, exit/error excerpt, whether an external job was submitted, and the smallest proposed correction. An obvious local argument/path error should be corrected by the worker immediately after checking the actual command signature; notification must not introduce an approval wait. Do not silently continue unrelated exploration while a failed launch blocks the next artifact. Check the existing script's usage/parser once before first invocation; reuse a verified invocation thereafter. Never infer provider waiting from an attempted command without a submission receipt.

## Checker owns steering and review

Remain read-only on production assets. Do not duplicate implementation, rerun already passing checks, generate parallel screenshots or write a second full report.

Own the correction loop through completion: `worker result -> reviewer defects -> worker correction -> reviewer verifies changed evidence -> pass`. A defect report alone is not completion. The reviewer sends corrections directly to the worker and awakens an idle worker when necessary. Keep one writer to avoid conflicting edits; the reviewer ensures fixes are completed rather than delegating that responsibility back to the parent.

Review the first useful result and final changed regions. Check inputs before costly execution only when novelty, expense or known registration risk warrants it. Reply with **pass**, or the exact defect plus one focused next action and acceptance condition. Protect accepted work and all required domain checks.

Use milestone messages and bounded waits, not continuous log polling. If a promised checkpoint is missed, inspect the specific command/dependency once and steer. A time target is not permission to relax quality checks or cancel a legitimate running job.

The checker is an active execution supervisor as well as an output reviewer. During an unproven launch or local setup, agree a short checkpoint (normally about two minutes), and use bounded event waits. On timeout without useful evidence, inspect the last relevant command/status once: distinguish active process, provider receipt, failed invocation, missing prerequisite and exploratory drift. Send one actionable correction and require its next evidence; a status paraphrase is not steering. After confirmed provider submission, use its expected latency or next completion event and avoid repeatedly checking unchanged state. Re-arm a checkpoint after a concrete correction or stage transition, not a stream of identical polls. This is best-effort agent coordination, not a guaranteed real-time watchdog.

Write the first complete result into the dispatch as the first acceptance item. A prerequisite preview is an intermediate checkpoint only, never a substitute for that result. The reviewer should defer optional docs, broad searches and extra examples until the requested artifact exists. Keep dispatch near the existing 200–300-word target with exact source pointers; do not paste the full history or a second copy of every skill. The host reads only the guidance needed for its review and delegates implementation detail to the worker.

Judge the requested output against the reference and actual domain requirements. Separate blocking functional/identity/fit defects from optional presentation polish. Give each blocking finding its evidence, applicable requirement and smallest correction; do not invent pixel-perfect intermediate-image requirements where the domain does not require them. Reviewers must move usable work into the next production step immediately after required checks pass, rather than opening another review campaign. If no usable output is emerging, revisit the route and dispatch assumptions, not merely the worker's pace.

Each worker milestone includes the next concrete output and an expected checkpoint. Check a missed checkpoint once; steer the exact slow step without rereading the whole task. Do not send the parent routine internal progress that requires no decision. Send the first inspected useful deliverable, a genuine escalation, and the final receipt.

After two failures of the same approach, stop repeating it. Escalate to Astra only when the pair lacks a proven next route, faces a consequential unresolved design/geometry decision, or materially disagrees about correctness. Supply the concise issue, relevant evidence, attempts and one concrete question. Astra returns a decision and stop criterion, then steps back again.

## Delivery and usage discipline

The checker sends the parent one final result packet or a genuine escalation. The parent maintains required user communication, but does not redo the passed review. Show the useful inspected result promptly; save exact output identity and stop after requested checks pass. Optional polish, packaging and repeated overview renders must not delay delivery.

- The parent must not independently inventory inputs, inspect every render, implement fixes, or repeatedly ask for status while the Sol pair owns those steps. Parent work is dispatch, required user communication, genuine decisions and final delivery.
- Use the longest event wait allowed by the active environment and communication requirements. Do not deliberately use short waits or alternate agent waits, file polls and status messages. Required progress updates should be factual and brief; do not repeat the plan or announce unchanged waiting.
- Do not expand the active prompt simply because a one-million-token window is available. Give each Sol a compact fresh packet and exact source pointers; retrieve the necessary portions. Context capacity is not a target prompt size or a compute-saving feature.
- Final receipt states the actual role/model dispatch, who made and reviewed corrections, exact deliverables, verification limits, and elapsed time when useful. Never describe this instruction-based workflow as an automatic model router or a token-budget enforcement service.

Report total wall time separately from provider time when relevant. Do not claim measured usage savings without usage evidence. An Astra parent still has coordination and final-response overhead; waiting and compact context reduce involvement but do not guarantee zero usage. No automatic Astra final review or time-based Astra polling.
