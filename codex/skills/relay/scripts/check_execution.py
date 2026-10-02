"""Read-only Relay queue checks. No scheduling, tool calls, or domain approval."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


def stamp(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Timestamps must include a timezone')
    return result


def check(document, now=None):
    state = document.get('relay_execution', document)
    now = now or datetime.now(timezone.utc)
    if state.get('version') != 1:
        raise ValueError('Expected relay_execution version 1')
    if not state.get('brief_revision'):
        raise ValueError('brief_revision is required')
    workers = state.get('workers', [])
    items = state.get('items', [])
    if not isinstance(workers, list) or not isinstance(items, list) or not items:
        raise ValueError('workers and nonempty items must be lists')
    for records in (workers, items):
        ids = [r['id'] for r in records]
        if len(ids) != len(set(ids)):
            raise ValueError('Duplicate IDs')
    by_worker = {w['id']: w for w in workers}
    by_item = {i['id']: i for i in items}
    findings = []

    def add(code, target, action):
        findings.append(dict(code=code, target=target, action=action))

    for worker in workers:
        wid = worker['id']
        if worker['state'] not in ('active', 'idle', 'unknown'):
            raise ValueError('Invalid worker state')
        if (now - stamp(worker['observed_at'])).total_seconds() > state.get('observation_max_age_seconds', 300):
            add('STALE_OBSERVATION', wid, 'Read one fresh worker state before claiming progress or reassigning.')
        dispatch = worker.get('last_dispatch', {})
        if dispatch.get('ok') is False:
            add('DISPATCH_FAILED', wid, 'Preserve failure; use the owning host and supported start tool. Do not claim restart.')
        if worker['state'] == 'active' and worker.get('ack_revision') != state['brief_revision']:
            add('BRIEF_NOT_ADOPTED', wid, 'Host steers the active worker to the current brief; verify its next action uses it.')

    active_states = ('working', 'review', 'needs_fix')
    ready = []
    for item in items:
        iid, status = item['id'], item['state']
        if status not in ('ready', 'working', 'review', 'needs_fix', 'done', 'blocked'):
            raise ValueError('Invalid item state')
        deps = item.get('depends_on', [])
        if any(d not in by_item for d in deps):
            raise ValueError('Unknown dependency')
        if status == 'ready' and all(by_item[d]['state'] == 'done' for d in deps):
            ready.append(iid)
        if status in active_states:
            owner = by_worker.get(item.get('owner'))
            if owner is None:
                add('NO_OWNER', iid, 'Assign one owner for this stage and preserve exclusive output ownership.')
            elif owner['state'] != 'active':
                add('OWNER_NOT_RUNNING', iid, 'Owning host must start the idle subagent with followup_task; a queued message is insufficient.')
            if not item.get('next_action') or not item.get('checkpoint_at'):
                add('NO_NEXT_CHECKPOINT', iid, 'Set the next executable action and a stage-appropriate evidence checkpoint.')
            elif now > stamp(item['checkpoint_at']):
                add('CHECKPOINT_OVERDUE', iid, 'Inspect the specific operation once; reconcile provider/process evidence and steer. Do not reset the clock without evidence.')
        if status == 'blocked' and item.get('blocker_kind') in ('implementation', 'optional', 'coordinator_choice'):
            add('SELF_IMPOSED_BLOCK', iid, 'Assign ordinary prerequisite work or remove optional/coordinator restriction within authorization.')
        if status == 'done':
            artifacts = item.get('artifacts', [])
            required = set(item.get('required_artifact_kinds', []))
            if not required or not required.issubset({a['kind'] for a in artifacts}):
                add('INCOMPLETE_DELIVERABLE', iid, 'Keep incomplete: the user-requested artifact kinds are missing.')
            for artifact in artifacts:
                path = Path(artifact['path'])
                if not path.is_file():
                    add('MISSING_ARTIFACT', iid, 'Restore the actual result or correct its status; a report is not its replacement.')
                    continue
                actual = hashlib.sha256(path.read_bytes()).hexdigest()
                if artifact.get('sha256') != actual:
                    add('STALE_ARTIFACT', iid, 'Reconcile changed output identity and review only affected evidence.')
            review = item.get('review', {})
            expected = {a.get('sha256') for a in artifacts}
            if (review.get('status') != 'passed' or not artifacts or None in expected
                    or not expected.issubset(set(review.get('artifact_sha256', [])))):
                add('UNBOUND_REVIEW', iid, 'Require an actual review of these output versions; hashes alone do not approve quality.')

    idle = [w['id'] for w in workers if w['state'] == 'idle']
    if ready and idle:
        add('READY_WORK_IDLE', ', '.join(ready), 'Dispatch the next eligible item to an idle worker through its owning host, within resource limits.')
    for attempt in state.get('approaches', []):
        if attempt.get('failures', 0) >= 2 and attempt.get('next_retry_planned') and not attempt.get('changed_mechanism_evidence'):
            add('REPEATED_METHOD', attempt['id'], 'Diagnose the shared cause before another retry; item IDs do not reset failures.')
    return dict(ok=not findings, findings=findings,
                counts={s: sum(i['state'] == s for i in items) for s in ('ready', 'working', 'review', 'needs_fix', 'done', 'blocked')},
                limitation='Checks declared execution state and file identity, not artistic quality, permission, or actual tool execution. Host must act.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('status', type=Path)
    args = parser.parse_args()
    try:
        result = check(json.loads(args.status.read_text(encoding='utf-8-sig')))
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print(json.dumps(dict(error=str(exc))))
        return 1
    print(json.dumps(result, indent=2))
    return 0 if result['ok'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
