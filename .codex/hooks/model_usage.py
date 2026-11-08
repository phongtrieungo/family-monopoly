#!/usr/bin/env python3
"""Diagnostic adapter: only actual PostModelRequest fields enter the ledger."""
from __future__ import annotations
import json
import sqlite3
import sys
from usage_ledger import DEFAULT_PATH, record, role_label, token_counts


def handle_event(event, path=DEFAULT_PATH):
    if not isinstance(event, dict):
        print('[codex-usage-warning] invalid event', file=sys.stderr)
        return
    name = event.get('hook_event_name')
    if name not in ('PreModelRequest', 'PostModelRequest'):
        return  # Never retain prompt text from UserPromptSubmit.
    model = json.dumps(event.get('model') or 'unknown', ensure_ascii=True)
    role = json.dumps(role_label(event), ensure_ascii=True)
    if name == 'PreModelRequest':
        print('[codex-route] role={} model={}'.format(role, model))
        return
    counts = token_counts(event.get('token_usage'))
    status = json.dumps(event.get('status') or 'unknown', ensure_ascii=True)
    details = 'tokens=unavailable' if all(v is None for v in counts.values()) else ' '.join(
        '{}={}'.format(k, v if v is not None else 'unavailable') for k, v in counts.items())
    print('[codex-usage] role={} model={} status={} {}'.format(role, model, status, details))
    try:
        record(path, event)
    except (OSError, sqlite3.Error, ValueError, OverflowError, KeyError, TypeError, AttributeError):
        print('[codex-usage-warning] ledger write failed; usage not recorded', file=sys.stderr)


def main():
    try:
        event = json.load(sys.stdin)
    except (ValueError, OSError, UnicodeError, RecursionError):
        print('[codex-usage-warning] invalid input ignored', file=sys.stderr)
        return 0
    handle_event(event)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
