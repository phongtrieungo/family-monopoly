#!/usr/bin/env python3
"""Read-only report by default; label explicitly writes manual attribution."""
import argparse
import json
import sqlite3
import sys
from pathlib import Path
from usage_ledger import DEFAULT_PATH, report, set_labels


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, default=DEFAULT_PATH)
    commands = parser.add_subparsers(dest='command', required=True)
    read = commands.add_parser('report')
    read.add_argument('--group-by', choices=('model', 'role', 'story', 'phase', 'status'), default='model')
    read.add_argument('--session')
    label = commands.add_parser('label', help='manual labels for subsequent observations only')
    label.add_argument('--session', required=True)
    label.add_argument('--turn', required=True)
    label.add_argument('--agent')
    for key in ('story', 'phase', 'retry-cause'):
        label.add_argument('--' + key)
    args = parser.parse_args(argv)
    try:
        if args.command == 'report':
            print(json.dumps(report(args.db, args.group_by, args.session), indent=2))
        else:
            labels = {k: getattr(args, k) for k in ('story', 'phase', 'retry_cause') if getattr(args, k) is not None}
            set_labels(args.db, args.session, args.turn, args.agent, **labels)
            print('Manual attribution saved for subsequent observations; earlier snapshots unchanged.')
    except (OSError, sqlite3.Error, ValueError, KeyError, TypeError, AttributeError):
        print('usage ledger error: cannot read/write valid ledger or labels', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
