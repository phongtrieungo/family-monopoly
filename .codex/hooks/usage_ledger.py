"""Allowlisted local accounting: no prompts, raw events, or error text."""
from __future__ import annotations
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_PATH = Path(__file__).resolve().parents[1] / 'usage' / 'ledger.sqlite3'
COUNTS = ('input', 'cached', 'output', 'reasoning', 'total')
IDENTIFIERS = ('session_id', 'turn_id', 'root_id', 'root_session_id', 'root_turn_id', 'parent_turn_id', 'parent_id',
               'root_agent_id', 'parent_session_id', 'parent_agent_id', 'agent_id', 'agent_type', 'model', 'effort', 'status')
LABELS = ('story', 'phase', 'retry_cause')


def text_field(value):
    return value if isinstance(value, str) and value else None


def number_at(value, *paths):
    for path in paths:
        current = value
        for part in path:
            current = current.get(part) if isinstance(current, dict) else None
        if isinstance(current, int) and not isinstance(current, bool) and 0 <= current <= 9223372036854775807:
            return current
    return None


def token_counts(usage):
    aliases = {
        'input': [('input_tokens',), ('inputTokens',)],
        'output': [('output_tokens',), ('outputTokens',)],
        'cached': [('cached_input_tokens',), ('cachedInputTokens',), ('input_tokens_details', 'cached_tokens'), ('inputTokensDetails', 'cachedTokens')],
        'reasoning': [('reasoning_output_tokens',), ('reasoningOutputTokens',), ('output_tokens_details', 'reasoning_tokens'), ('outputTokensDetails', 'reasoningTokens')],
        'total': [('total_tokens',), ('totalTokens',)],
    }
    result = {key: number_at(usage, *aliases[key]) for key in COUNTS}
    if result['total'] is None and all(result[k] is not None for k in ('input', 'output')):
        total = result['input'] + result['output']
        result['total'] = total if total <= 9223372036854775807 else None
    return result


def role_label(event):
    if text_field(event.get('agent_type')):
        return 'subagent:' + event['agent_type']
    if event.get('parent_id') or event.get('parent_agent_id'):
        return 'subagent:unknown'
    return 'unknown' if event.get('agent_id') else 'root'


def connect_write(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(path), timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute('CREATE TABLE IF NOT EXISTS observations (id INTEGER PRIMARY KEY, response_id TEXT UNIQUE, observed_at TEXT NOT NULL, data TEXT NOT NULL)')
        connection.execute('CREATE TABLE IF NOT EXISTS labels (session_id TEXT NOT NULL, turn_id TEXT NOT NULL, agent_id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(session_id, turn_id, agent_id))')
    except BaseException:
        connection.close()
        raise
    return connection


def set_labels(path, session_id, turn_id, agent_id=None, **labels):
    if not text_field(session_id) or not text_field(turn_id):
        raise ValueError('labels require session and turn IDs')
    if not labels or any(k not in LABELS or not text_field(v) for k, v in labels.items()):
        raise ValueError('provide nonempty story, phase, or retry-cause labels')
    connection = connect_write(path)
    try:
        with connection:
            connection.execute('BEGIN IMMEDIATE')
            scope = (session_id, turn_id, agent_id or '')
            row = connection.execute('SELECT data FROM labels WHERE session_id=? AND turn_id=? AND agent_id=?', scope).fetchone()
            merged = json.loads(row['data']) if row else {}
            merged.update(labels)
            connection.execute('INSERT OR REPLACE INTO labels VALUES (?, ?, ?, ?)',
                               scope + (json.dumps(merged),))
    finally:
        connection.close()


def record(path, event):
    """Atomic response upsert; identityless observations always stay separate."""
    data = {key: text_field(event.get(key)) for key in IDENTIFIERS}
    data['effort'] = data['effort'] or text_field(event.get('reasoning_effort'))
    data['role'] = role_label(event)
    data['error_present'] = bool(event.get('error'))
    data['usage_source'] = 'runtime_hook'
    data['counts'] = token_counts(event.get('token_usage'))
    data['total_source'] = ('runtime_hook' if number_at(event.get('token_usage'), ('total_tokens',), ('totalTokens',)) is not None
                            else 'derived_input_plus_output' if data['counts']['total'] is not None else None)
    data['labels'] = {}
    response_id = text_field(event.get('response_id'))
    data['identity'] = 'stable_response_id' if response_id else 'deduplication_unavailable'
    connection = connect_write(path)
    try:
        with connection:
            connection.execute('BEGIN IMMEDIATE')
            manual = {}
            if data['session_id'] and data['turn_id']:
                for agent in dict.fromkeys(('', data['agent_id'] or '')):
                    row = connection.execute('SELECT data FROM labels WHERE session_id=? AND turn_id=? AND agent_id=?',
                                             (data['session_id'], data['turn_id'], agent)).fetchone()
                    if row:
                        manual.update(json.loads(row['data']))
            for key in LABELS:
                actual = text_field(event.get(key))
                data['labels'][key] = {'value': actual or manual.get(key),
                                       'source': 'runtime_hook' if actual else 'manual' if key in manual else None}
            row = connection.execute('SELECT id, data FROM observations WHERE response_id=?', (response_id,)).fetchone() if response_id else None
            if row:
                old = json.loads(row['data'])
                for key in IDENTIFIERS:
                    if old[key] is None:
                        old[key] = data[key]
                for key in COUNTS:
                    if key != 'total' and old['counts'][key] is None:
                        old['counts'][key] = data['counts'][key]
                # Incoming derived totals may include primitive counts we rejected.
                # Only an explicit runtime total can be copied independently.
                if old['counts']['total'] is None and data['total_source'] == 'runtime_hook':
                    old['counts']['total'] = data['counts']['total']
                    old['total_source'] = 'runtime_hook'
                if old['counts']['total'] is None and all(old['counts'][k] is not None for k in ('input', 'output')):
                    total = old['counts']['input'] + old['counts']['output']
                    if total <= 9223372036854775807:
                        old['counts']['total'] = total
                        old['total_source'] = 'derived_input_plus_output'
                for key in LABELS:
                    if data['labels'][key]['source'] == 'runtime_hook' and old['labels'][key]['source'] != 'runtime_hook':
                        old['labels'][key] = data['labels'][key]
                old['role'] = role_label(old)
                old['error_present'] = old['error_present'] or data['error_present']
                data = old  # Keep the first attribution snapshot.
                connection.execute('UPDATE observations SET data=? WHERE id=?', (json.dumps(data), row['id']))
            else:
                connection.execute('INSERT INTO observations(response_id, observed_at, data) VALUES (?, ?, ?)',
                                   (response_id, datetime.now(timezone.utc).isoformat(), json.dumps(data)))
    finally:
        connection.close()
    return data


def report(path, group_by='model', session=None):
    if group_by not in ('model', 'role', 'story', 'phase', 'status'):
        raise ValueError('unsupported grouping')
    path = Path(path)
    if not path.exists():
        return {'state': 'no_recorded_usage', 'groups': [], 'note': 'No recorded usage; cost is unknown.'}
    connection = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True, timeout=10)
    try:
        rows = connection.execute('SELECT data FROM observations').fetchall()
    finally:
        connection.close()
    groups = {}
    for row in rows:
        data = json.loads(row[0])
        if session and session not in (data['session_id'], data['root_session_id']):
            continue
        label = data['labels'].get(group_by, {})
        key = (label.get('value') if group_by in LABELS else data[group_by]) or 'unknown'
        group = groups.setdefault(key, {'group': key, 'observations': 0,
            'known_subtotal': dict.fromkeys(COUNTS, 0), 'missing_fields': dict.fromkeys(COUNTS, 0),
            'unidentifiable_observations': 0, 'status_counts': {}, 'role_counts': {}, 'attribution_sources': {}})
        group['observations'] += 1
        group['unidentifiable_observations'] += data['identity'] == 'deduplication_unavailable'
        for counter, value in data['counts'].items():
            if value is None:
                group['missing_fields'][counter] += 1
            else:
                group['known_subtotal'][counter] += value
        for field, source in (('status_counts', data['status'] or 'unknown'), ('role_counts', data['role']),
                              ('attribution_sources', label.get('source') or ('unknown' if group_by in LABELS else 'runtime_hook'))):
            group[field][source] = group[field].get(source, 0) + 1
    return {'state': 'recorded_observations' if groups else 'no_recorded_usage',
            'groups': [groups[k] for k in sorted(groups)],
            'note': 'Known subtotals only; missing fields and unidentified observations prevent exact cost/attempt claims. Cached is included in input; reasoning is included in output. No billing rates applied.'}
