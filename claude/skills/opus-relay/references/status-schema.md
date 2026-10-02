# STATUS.json schema (checked by scripts/check_execution.py)

```json
{
  "relay_execution": {
    "version": 1,
    "brief_revision": "r1",
    "observation_max_age_seconds": 900,
    "workers": [
      {"id": "w-render", "state": "active", "observed_at": "2026-10-01T13:00:00+00:00", "ack_revision": "r1"}
    ],
    "items": [
      {"id": "outfit-74440496", "state": "working", "owner": "w-render",
       "next_action": "render 4 views", "checkpoint_at": "2026-10-01T13:20:00+00:00", "depends_on": []},
      {"id": "outfit-75659143", "state": "done",
       "required_artifact_kinds": ["render", "landmarks"],
       "artifacts": [{"kind": "render", "path": "...", "sha256": "..."}],
       "review": {"status": "passed", "artifact_sha256": ["..."]}},
      {"id": "x", "state": "blocked", "blocker_kind": "external"}
    ],
    "approaches": [
      {"id": "ai-fit-picture", "failures": 6, "next_retry_planned": false}
    ]
  },
  "counts": {"prepared": 0, "intermediate": 0, "delivered": 0, "reviewed": 0}
}
```

- Worker `state`: active | idle | unknown. Item `state`: ready | working | review | needs_fix | done | blocked.
- `blocker_kind`: `external` (real dependency) vs `implementation` / `optional` / `coordinator_choice` (flagged as self-imposed).
- Exit codes: 0 clean, 2 findings to act on, 1 invalid input. The script checks declared state and file hashes only — not quality.
