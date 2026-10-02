# Verify execution, not message delivery

Use for multi-item relays or recovery from a stall. The existing Sol host owns these steps; this does not add a coordinator, approval layer or background service.

At dispatch, worker completion, failed tool call, changed brief or missed checkpoint:

1. Observe the actual worker state once. Preserve the tool's success/error result before making a dependent claim. A successful send only confirms delivery; it does not prove work started.
2. Match the control tool to the worker. For an idle collaboration subagent, its owning host calls `collaboration.followup_task`. `send_message` alone does not start it. App thread tools may reject subagents; on rejection ask the owning host to act, then verify. Never announce restart from a rejected call.
3. Reconcile the queue and live jobs. Keep one writer per output. Start eligible work without waiting for unrelated item corrections. Do not repeat paid jobs or steal an active claim.
4. After changing the brief, require the worker's next action/evidence to reflect that revision. Editing the skill on disk does not reload running agents. Send a concise instruction to adopt it; preserve live jobs and accepted outputs.
5. Verify action: an active turn plus the expected stage/receipt, followed by its artifact at the agreed checkpoint. If the host has not acted, it still owns the problem; another reassuring status message is not a correction.

For substantial batches, use the standard-library helper `scripts/check_execution.py PATH_TO_EXISTING_STATUS.json` after these events. Add a `relay_execution` block to the existing status, not a separate reporting system. Exit 0 means no declared-state problems, 2 means actionable findings, 1 means invalid input. Fix findings through normal tools; this helper does not execute tools, authorize work, approve quality, or run in the background. A coordinator can inspect the same invariants directly for small tasks; schema work must not delay delivery.

Minimal block (timestamps below are examples to replace with real observations):

```json
{
  "relay_execution": {
    "version": 1,
    "brief_revision": "r3",
    "workers": [
      {"id": "worker_b", "state": "idle", "observed_at": "2026-10-01T12:00:00Z", "ack_revision": "r3"}
    ],
    "items": [
      {"id": "next_item", "state": "ready", "depends_on": []}
    ]
  }
}
```

Active items use `owner`, `next_action`, and `checkpoint_at` (timezone-aware). Use a realistic provider-specific checkpoint, not an arbitrary fixed speed guarantee. Fresh observation age defaults to 300 seconds, adjustable with `observation_max_age_seconds`; an overdue check requires inspection, not cancellation or blind resubmission.

For done items, declare `required_artifact_kinds`, `artifacts` with `kind`, `path`, `sha256`, and `review` with `status: passed` and `artifact_sha256`. The checker verifies existence and binding only: the reviewer still must actually inspect the requested result. A preview cannot count as the requested artifact merely by relabeling it.

Use `blocker_kind` for blocked items: `implementation`, `optional`, or `coordinator_choice` flags an internal obstacle to resolve; a genuine external dependency is `external`. These are coordinator judgments, not facts inferred by the helper. Record shared retry history in `approaches`: `id`, `failures`, `next_retry_planned`, and any `changed_mechanism_evidence`. Use real evidence, not a token label to silence a finding.

This makes common stalls detectable when invoked. It does not guarantee future completion, enforce scheduling, or replace accurate observations and human judgment.
