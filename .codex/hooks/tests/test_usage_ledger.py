"""Synthetic fixtures call helpers with temporary DBs, never the live hook main."""
import contextlib
import io
import json
import multiprocessing
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from usage_ledger import DEFAULT_PATH, COUNTS, record, report, set_labels, token_counts
from model_usage import handle_event
from usage_report import main as cli


def concurrent_writer(path, index):
    record(path, {'response_id': 'r' + str(index), 'model': 'model',
                  'agent_type': 'guardian' if index % 2 else None,
                  'token_usage': {'input_tokens': 10, 'output_tokens': 2}})


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Path(self.temp.name) / 'usage.sqlite3'

    def tearDown(self):
        self.temp.cleanup()

    def event(self, **changes):
        event = {'response_id': 'response', 'session_id': 'session', 'turn_id': 'turn',
                 'model': 'actual-model', 'reasoning_effort': 'high', 'status': 'completed',
                 'token_usage': {'input_tokens': 100, 'output_tokens': 20,
                                 'input_tokens_details': {'cached_tokens': 80},
                                 'output_tokens_details': {'reasoning_tokens': 9}}}
        event.update(changes)
        return event

    def data(self):
        with sqlite3.connect(str(self.db)) as connection:
            return [json.loads(row[0]) for row in connection.execute('SELECT data FROM observations')]

    def test_u01_allowlist_and_provenance(self):
        data = record(self.db, self.event(prompt='SECRET', error='SECRET', root_id='root', parent_id='parent', root_turn_id='root-turn', parent_turn_id='parent-turn', agent_id='child', agent_type='guardian'))
        self.assertEqual(data['counts']['total'], 120)
        self.assertEqual(data['effort'], 'high')
        self.assertTrue(data['error_present'])
        self.assertEqual(data['usage_source'], 'runtime_hook')
        self.assertEqual(data['role'], 'subagent:guardian')
        self.assertEqual(data['root_id'], 'root')
        self.assertEqual(data['root_turn_id'], 'root-turn')
        self.assertEqual(data['parent_turn_id'], 'parent-turn')
        self.assertNotIn('SECRET', self.db.read_bytes().decode('latin1'))
        with sqlite3.connect(str(self.db)) as connection:
            self.assertRegex(connection.execute('SELECT observed_at FROM observations').fetchone()[0], r'^\d{4}-')

    def test_u02_partial_null_and_no_double_count(self):
        self.assertIsNone(token_counts({'input_tokens': 5})['total'])
        self.assertEqual(token_counts(None), dict.fromkeys(COUNTS))
        counts = token_counts({'input_tokens': 100, 'cached_input_tokens': 80, 'output_tokens': 20, 'reasoning_output_tokens': 10})
        self.assertEqual(counts['total'], 120)
        for bad in (True, -1, 1.5, float('inf'), '4', 2**63):
            self.assertIsNone(token_counts({'input_tokens': bad})['input'])

    def test_aliases(self):
        variants = [
            {'inputTokens': 10, 'outputTokens': 2, 'cachedInputTokens': 8, 'reasoningOutputTokens': 1, 'totalTokens': 12},
            {'input_tokens': 10, 'output_tokens': 2, 'cached_input_tokens': 8, 'reasoning_output_tokens': 1, 'total_tokens': 12},
            {'inputTokens': 10, 'outputTokens': 2, 'inputTokensDetails': {'cachedTokens': 8}, 'outputTokensDetails': {'reasoningTokens': 1}},
            {'input_tokens': 10, 'output_tokens': 2, 'input_tokens_details': {'cached_tokens': 8}, 'output_tokens_details': {'reasoning_tokens': 1}},
        ]
        for variant in variants:
            self.assertEqual(token_counts(variant), dict(input=10, output=2, cached=8, reasoning=1, total=12))

    def test_u03_duplicate_enrichment(self):
        record(self.db, self.event(token_usage={'input_tokens': 10}))
        record(self.db, self.event(token_usage={'output_tokens': 2}))
        record(self.db, self.event(token_usage={'input_tokens': 999}))
        rows = self.data()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['counts']['total'], 12)
        self.assertEqual(rows[0]['counts']['input'], 10)
        self.assertEqual(rows[0]['total_source'], 'derived_input_plus_output')

    def test_duplicate_conflicting_input_derives_from_retained_counts(self):
        record(self.db, self.event(token_usage={'input_tokens': 10}))
        record(self.db, self.event(token_usage={'input_tokens': 999, 'output_tokens': 2}))
        data = self.data()[0]
        self.assertEqual(data['counts']['input'], 10)
        self.assertEqual(data['counts']['output'], 2)
        self.assertEqual(data['counts']['total'], 12)
        self.assertEqual(data['total_source'], 'derived_input_plus_output')
        self.assertEqual(report(self.db)['groups'][0]['known_subtotal']['total'], 12)

    def test_duplicate_explicit_total_preserves_runtime_provenance(self):
        record(self.db, self.event(token_usage={'input_tokens': 10}))
        record(self.db, self.event(token_usage={'input_tokens': 999, 'output_tokens': 2, 'total_tokens': 50}))
        data = self.data()[0]
        self.assertEqual(data['counts']['input'], 10)
        self.assertEqual(data['counts']['total'], 50)
        self.assertEqual(data['total_source'], 'runtime_hook')
        record(self.db, self.event(token_usage={'input_tokens': 999, 'output_tokens': 999, 'total_tokens': 1998}))
        self.assertEqual(self.data()[0]['counts']['total'], 50)
        self.assertEqual(self.data()[0]['total_source'], 'runtime_hook')

    def test_unknown_roles_stored_reported_and_enriched(self):
        record(self.db, self.event(response_id='agent-only', agent_id='agent'))
        record(self.db, self.event(response_id='linked-child', agent_id='child', parent_agent_id='parent'))
        self.assertEqual([row['role'] for row in self.data()], ['unknown', 'subagent:unknown'])
        groups = {group['group']: group for group in report(self.db, 'role')['groups']}
        self.assertEqual(set(groups), {'unknown', 'subagent:unknown'})
        self.assertEqual(groups['unknown']['role_counts'], {'unknown': 1})
        self.assertEqual(groups['subagent:unknown']['role_counts'], {'subagent:unknown': 1})
        record(self.db, self.event(response_id='linked-child', agent_type='guardian'))
        record(self.db, self.event(response_id='agent-only', agent_type='reviewer'))
        # A subsequent callback without linkage/type must not erase known roles.
        record(self.db, self.event(response_id='linked-child'))
        self.assertEqual([row['role'] for row in self.data()], ['subagent:reviewer', 'subagent:guardian'])
        groups = {group['group']: group for group in report(self.db, 'role')['groups']}
        self.assertEqual(set(groups), {'subagent:reviewer', 'subagent:guardian'})
        self.assertEqual(groups['subagent:guardian']['role_counts'], {'subagent:guardian': 1})
        self.assertEqual(groups['subagent:reviewer']['role_counts'], {'subagent:reviewer': 1})

    def test_u04_identical_identityless_observations(self):
        for _ in range(3):
            record(self.db, self.event(response_id=None))
        group = report(self.db)['groups'][0]
        self.assertEqual(group['observations'], 3)
        self.assertEqual(group['unidentifiable_observations'], 3)

    def test_u05_concurrent_process_writers_missing_ids(self):
        ctx = multiprocessing.get_context('spawn')
        processes = [ctx.Process(target=concurrent_writer, args=(self.db, i)) for i in range(12)]
        for process in processes:
            process.start()
        for process in processes:
            process.join(20)
            self.assertEqual(process.exitcode, 0)
        group = report(self.db)['groups'][0]
        self.assertEqual(group['observations'], 12)
        self.assertEqual(group['known_subtotal']['total'], 144)
        self.assertEqual(group['role_counts']['subagent:guardian'], 6)

    def test_concurrent_same_response(self):
        ctx = multiprocessing.get_context('spawn')
        processes = [ctx.Process(target=concurrent_writer, args=(self.db, 1)) for _ in range(6)]
        for process in processes:
            process.start()
        for process in processes:
            process.join(20)
            self.assertEqual(process.exitcode, 0)
        self.assertEqual(report(self.db)['groups'][0]['observations'], 1)

    def test_u06_scope_snapshot_runtime_precedence(self):
        set_labels(self.db, 'session', 'turn', story='story-1', phase='build', retry_cause='manual retry')
        set_labels(self.db, 'session', 'turn', 'child', phase='review')
        record(self.db, self.event())
        record(self.db, self.event(response_id='child', agent_id='child', agent_type='guardian', story='runtime-story'))
        set_labels(self.db, 'session', 'turn', story='story-2')
        record(self.db, self.event())
        record(self.db, self.event(response_id='new'))
        record(self.db, self.event(response_id='other', turn_id='other'))
        data = self.data()
        self.assertEqual(data[0]['labels']['story'], {'value': 'story-1', 'source': 'manual'})
        self.assertEqual(data[1]['labels']['story']['source'], 'runtime_hook')
        self.assertEqual(data[1]['labels']['phase']['value'], 'review')
        self.assertEqual(data[2]['labels']['story']['value'], 'story-2')
        self.assertIsNone(data[3]['labels']['story']['value'])
        self.assertEqual(data[0]['model'], 'actual-model')
        record(self.db, self.event(story='runtime-enrichment'))
        self.assertEqual(self.data()[0]['labels']['story']['source'], 'runtime_hook')

    def test_label_phase_update_retains_story(self):
        set_labels(self.db, 'session', 'turn', story='story-1', phase='build')
        set_labels(self.db, 'session', 'turn', phase='verify')
        data = record(self.db, self.event())
        self.assertEqual(data['labels']['story']['value'], 'story-1')
        self.assertEqual(data['labels']['phase']['value'], 'verify')

    def test_u07_reports_groups_missing_status_and_session(self):
        record(self.db, self.event())
        record(self.db, self.event(response_id=None, session_id='child', root_session_id='session', agent_type='guardian', status='failed', token_usage={'input_tokens': 5}))
        record(self.db, self.event(response_id='unrelated', session_id='other', token_usage=None))
        group = report(self.db, session='session')['groups'][0]
        self.assertEqual(group['observations'], 2)
        self.assertEqual(group['known_subtotal']['total'], 120)
        self.assertEqual(group['missing_fields']['total'], 1)
        self.assertEqual(group['status_counts'], {'completed': 1, 'failed': 1})
        self.assertEqual(report(self.db, session='absent')['groups'], [])

    def test_exact_grouping_keys_counts_and_attribution(self):
        set_labels(self.db, 'session', 'turn', story='manual-story', phase='manual-phase')
        record(self.db, self.event(model='model-a'))
        record(self.db, self.event(response_id='child', model='model-b', agent_type='guardian',
                                  story='runtime-story', phase='runtime-phase', status='failed',
                                  token_usage={'input_tokens': 5}))
        record(self.db, self.event(response_id='unknown', model=None, turn_id='unlabeled',
                                  agent_id='agent-only', status=None, token_usage=None))
        expected_counts = [
            dict(input=100, cached=80, output=20, reasoning=9, total=120),
            dict(input=5, cached=0, output=0, reasoning=0, total=0),
            dict.fromkeys(COUNTS, 0),
        ]
        expected_missing = [
            dict.fromkeys(COUNTS, 0),
            dict(input=0, cached=1, output=1, reasoning=1, total=1),
            dict.fromkeys(COUNTS, 1),
        ]
        for grouping, keys in (
            ('model', ('model-a', 'model-b', 'unknown')),
            ('role', ('root', 'subagent:guardian', 'unknown')),
            ('story', ('manual-story', 'runtime-story', 'unknown')),
            ('phase', ('manual-phase', 'runtime-phase', 'unknown')),
            ('status', ('completed', 'failed', 'unknown')),
        ):
            with self.subTest(grouping=grouping):
                groups = {group['group']: group for group in report(self.db, grouping)['groups']}
                self.assertEqual(set(groups), set(keys))
                for index, key in enumerate(keys):
                    group = groups[key]
                    self.assertEqual(group['observations'], 1)
                    self.assertEqual(group['known_subtotal'], expected_counts[index])
                    self.assertEqual(group['missing_fields'], expected_missing[index])
                    self.assertEqual(group['status_counts'], {('completed', 'failed', 'unknown')[index]: 1})
                    self.assertEqual(group['role_counts'], {('root', 'subagent:guardian', 'unknown')[index]: 1})
                    source = ('manual', 'runtime_hook', 'unknown')[index] if grouping in ('story', 'phase') else 'runtime_hook'
                    self.assertEqual(group['attribution_sources'], {source: 1})

    def test_u07_absent_and_empty_read_only(self):
        self.assertEqual(report(self.db)['state'], 'no_recorded_usage')
        self.assertFalse(self.db.exists())
        set_labels(self.db, 's', 't', story='x')
        self.assertEqual(report(self.db)['groups'], [])
        self.assertEqual(DEFAULT_PATH, Path(__file__).resolve().parents[2] / 'usage' / 'ledger.sqlite3')
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(cli(['--db', str(self.db), 'report']), 0)

    def test_u08_bad_input_and_storage_errors(self):
        output = io.StringIO()
        with contextlib.redirect_stderr(output):
            handle_event([], self.db)
        self.assertFalse(self.db.exists())
        self.db.write_text('corrupt')
        with contextlib.redirect_stderr(output), contextlib.redirect_stdout(io.StringIO()):
            handle_event(self.event(hook_event_name='PostModelRequest'), self.db)
            self.assertEqual(cli(['--db', str(self.db), 'report']), 1)
        self.assertIn('ledger write failed', output.getvalue())
        self.assertIn('usage ledger error', output.getvalue())
        with patch('usage_ledger.sqlite3.connect', side_effect=sqlite3.OperationalError('SECRET')):
            with contextlib.redirect_stderr(output), contextlib.redirect_stdout(io.StringIO()):
                handle_event(self.event(hook_event_name='PostModelRequest'), self.db)
        self.assertNotIn('SECRET', output.getvalue())

    def test_corrupt_rows_and_unreadable_report_are_errors(self):
        record(self.db, self.event())
        with sqlite3.connect(str(self.db)) as connection:
            connection.execute("UPDATE observations SET data='{}'")
        output = io.StringIO()
        with contextlib.redirect_stderr(output), contextlib.redirect_stdout(io.StringIO()):
            handle_event(self.event(hook_event_name='PostModelRequest'), self.db)
            self.assertEqual(cli(['--db', str(self.db), 'report']), 1)
        self.assertIn('ledger write failed', output.getvalue())
        with patch('usage_ledger.sqlite3.connect', side_effect=PermissionError('SECRET')):
            with contextlib.redirect_stderr(output):
                self.assertEqual(cli(['--db', str(self.db), 'report']), 1)
        self.assertNotIn('SECRET', output.getvalue())

    def test_cli_labels_and_no_invalid_label_writes(self):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(cli(['--db', str(self.db), 'label', '--session', 's', '--turn', 't']), 1)
            self.assertFalse(self.db.exists())
            self.assertEqual(cli(['--db', str(self.db), 'label', '--session', 's', '--turn', 't', '--story', 'x']), 0)

    def test_diagnostic_adapter_without_live_main(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            handle_event({'hook_event_name': 'UserPromptSubmit', 'prompt': 'SECRET'}, self.db)
            handle_event({'hook_event_name': 'PreModelRequest', 'model': 'm'}, self.db)
            self.assertFalse(self.db.exists())
            handle_event({'hook_event_name': 'PostModelRequest', 'model': 'm'}, self.db)
        self.assertIn('[codex-route]', output.getvalue())
        self.assertIn('tokens=unavailable', output.getvalue())
        self.assertNotIn('SECRET', output.getvalue())


if __name__ == '__main__':
    unittest.main()
