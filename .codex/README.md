# Codex model usage ledger

The project's [hook registration](hooks.json) preserves diagnostic `[codex-route]` and `[codex-usage]` lines. Actual `PostModelRequest` observations are stored locally in `.codex/usage/ledger.sqlite3`, resolved from the hook's repository rather than the invocation directory. `.gitignore` excludes the whole usage directory, including SQLite sidecars. No prompts, raw events, or error messages are stored. No historical import or billing estimate is performed.

Review and trust changed hooks through `/hooks` in the CLI or **Settings → Hooks** in the desktop app. Registration and owner enablement do not prove that telemetry is live; absent output means model and token evidence are unavailable.

The [official hook documentation](https://learn.chatgpt.com/docs/hooks) describes each model request attempt, including retries, with model/turn and optional agent fields. Status, error and token usage may be supplied. Stable response IDs, story and phase are not guaranteed. The ledger preserves supported optional identifiers, effort and attribution fields when supplied; it does not invent them.

Run these from the repository root (or use an absolute script path):

```sh
/usr/bin/python3 .codex/hooks/usage_report.py report --group-by model
/usr/bin/python3 .codex/hooks/usage_report.py report --group-by role --session SESSION_ID
/usr/bin/python3 .codex/hooks/usage_report.py report --group-by story
/usr/bin/python3 .codex/hooks/usage_report.py report --group-by phase
/usr/bin/python3 .codex/hooks/usage_report.py report --group-by status
/usr/bin/python3 .codex/hooks/usage_report.py label --session SESSION_ID --turn TURN_ID --story OPT-05 --phase implementation
/usr/bin/python3 .codex/hooks/usage_report.py label --session SESSION_ID --turn TURN_ID --agent AGENT_ID --phase review --retry-cause verification-fix
```

`label` writes **manual attribution**, scoped to an exact session and turn, optionally an agent. Supplied label fields update that scope; omitted fields retain their previous values. Agent-specific values override general values; runtime-provided attribution takes precedence. Labels apply to subsequent observations and are snapshotted: changing labels never rewrites previous observations. A repeated stable response can enrich missing runtime fields, including replacing manual attribution with actual runtime attribution. Labels cannot set a model or token count. Use session/turn IDs from actual runtime evidence; missing IDs cannot match labels. Missing agent IDs cannot match agent-specific labels.

Reports are read-only, including when no database exists. `--db PATH` before the command selects another database for reports or labels. Session filtering includes matching `session_id` and any explicitly supplied `root_session_id`; without those links, child membership cannot be inferred. Reports otherwise aggregate all observations, with `role_counts` keeping guardian subagents distinguishable. An agent ID alone cannot establish a root role and is reported as unknown.

Each group reports known subtotals, missing-field counts, status/role counts, attribution sources and unidentifiable observation counts. Missing usage stays null. Total is derived only from known input and output; cached counts are included in input, and reasoning counts in output. Never add those subsets again. A stable `response_id`, if actually supplied, counts once and may enrich missing fields. Without it, identical callbacks remain separate observations; neither deduplication nor exact attempt counts can be claimed. Known conflicting fields retain the first observation. Unknown fields are never zero usage. No recorded usage means unknown cost, and no billing rates have been verified.

Concurrent writes use SQLite transactions. Hook storage failures emit a concise warning and return normally. Reporting corrupt or unreadable storage exits nonzero; it never claims clean or zero usage. Tests use temporary databases and pure helpers, never fabricated live hook invocations:

```sh
python3 -m unittest discover -s .codex/hooks/tests -v
```
