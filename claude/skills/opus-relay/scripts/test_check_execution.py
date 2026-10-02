import copy
import hashlib
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from check_execution import check


NOW = datetime(2026, 10, 1, 12, 0, tzinfo=timezone.utc)


class ExecutionChecks(unittest.TestCase):
    def setUp(self):
        self.state = dict(version=1, brief_revision='r2', workers=[dict(
            id='a', state='active', observed_at=NOW.isoformat(), ack_revision='r2')],
            items=[dict(id='one', state='working', owner='a', next_action='compile actual maps',
                        checkpoint_at='2026-10-01T12:02:00Z')])

    def codes(self, state=None):
        return {f['code'] for f in check(state or self.state, NOW)['findings']}

    def test_active_operation_with_current_evidence(self):
        self.assertEqual(self.codes(), set())

    def test_sent_message_does_not_restart_idle_worker(self):
        self.state['workers'][0].update(state='idle', last_dispatch={'ok': True})
        self.assertIn('OWNER_NOT_RUNNING', self.codes())

    def test_rejected_tool_cannot_support_restart_claim(self):
        self.state['workers'][0]['last_dispatch'] = {'ok': False}
        self.assertIn('DISPATCH_FAILED', self.codes())

    def test_changed_skill_does_not_imply_adoption(self):
        self.state['workers'][0]['ack_revision'] = 'r1'
        self.assertIn('BRIEF_NOT_ADOPTED', self.codes())

    def test_local_correction_does_not_block_ready_item(self):
        self.state['items'][0]['state'] = 'needs_fix'
        self.state['workers'].append(dict(id='b', state='idle', observed_at=NOW.isoformat()))
        self.state['items'].append(dict(id='two', state='ready', depends_on=[]))
        self.assertIn('READY_WORK_IDLE', self.codes())

    def test_genuine_dependency_not_dispatched_prematurely(self):
        self.state['workers'].append(dict(id='b', state='idle', observed_at=NOW.isoformat()))
        self.state['items'].append(dict(id='two', state='ready', depends_on=['one']))
        self.assertNotIn('READY_WORK_IDLE', self.codes())

    def test_missing_contract_is_internal_work(self):
        self.state['items'][0].update(state='blocked', blocker_kind='implementation')
        self.assertIn('SELF_IMPOSED_BLOCK', self.codes())

    def test_external_blocker_does_not_get_waived(self):
        self.state['items'][0].update(state='blocked', blocker_kind='external')
        self.assertNotIn('SELF_IMPOSED_BLOCK', self.codes())

    def test_intermediate_preview_cannot_replace_required_maps(self):
        self.state['items'][0].update(state='done', required_artifact_kinds=['opacity', 'render'], artifacts=[])
        self.assertIn('INCOMPLETE_DELIVERABLE', self.codes())

    def test_review_must_follow_current_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            artifact = Path(tmp) / 'output.bin'
            artifact.write_bytes(b'original')
            digest = hashlib.sha256(b'original').hexdigest()
            self.state['items'][0].update(state='done', required_artifact_kinds=['output'],
                artifacts=[dict(kind='output', path=str(artifact), sha256=digest)],
                review=dict(status='passed', artifact_sha256=[digest]))
            self.assertEqual(self.codes(), set())
            artifact.write_bytes(b'changed')
            self.assertIn('STALE_ARTIFACT', self.codes())

    def test_old_review_cannot_approve_new_artifact(self):
        with tempfile.TemporaryDirectory() as tmp:
            artifact = Path(tmp) / 'output.bin'
            artifact.write_bytes(b'current')
            self.state['items'][0].update(state='done', required_artifact_kinds=['output'],
                artifacts=[dict(kind='output', path=str(artifact), sha256=hashlib.sha256(b'current').hexdigest())],
                review=dict(status='passed', artifact_sha256=['previous']))
            self.assertIn('UNBOUND_REVIEW', self.codes())

    def test_real_checkpoint_overdue(self):
        self.state['items'][0]['checkpoint_at'] = '2026-10-01T11:45:00Z'
        self.assertIn('CHECKPOINT_OVERDUE', self.codes())

    def test_slow_provider_inside_declared_window(self):
        self.state['items'][0]['checkpoint_at'] = '2026-10-01T12:30:00Z'
        self.assertNotIn('CHECKPOINT_OVERDUE', self.codes())

    def test_stale_worker_observation(self):
        self.state['workers'][0]['observed_at'] = '2026-10-01T11:45:00Z'
        self.assertIn('STALE_OBSERVATION', self.codes())

    def test_shared_retry_history_survives_item_change(self):
        self.state['approaches'] = [dict(id='four_view_fit', failures=5, next_retry_planned=True)]
        self.assertIn('REPEATED_METHOD', self.codes())
        self.state['approaches'][0]['changed_mechanism_evidence'] = 'independent view inputs; saved diagnostic receipt'
        self.assertNotIn('REPEATED_METHOD', self.codes())

    def test_embedded_status_does_not_modify_input(self):
        before = copy.deepcopy(self.state)
        self.assertTrue(check({'relay_execution': self.state}, NOW)['ok'])
        self.assertEqual(self.state, before)

    def test_bad_dependency_or_duplicate_identity_rejected(self):
        self.state['items'][0]['depends_on'] = ['absent']
        with self.assertRaises(ValueError):
            check(self.state, NOW)
        self.state['items'][0]['depends_on'] = []
        self.state['items'].append(copy.deepcopy(self.state['items'][0]))
        with self.assertRaises(ValueError):
            check(self.state, NOW)


if __name__ == '__main__':
    unittest.main()
