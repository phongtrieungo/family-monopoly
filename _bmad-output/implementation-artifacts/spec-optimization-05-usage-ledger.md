---
title: 'OPT-05: durable model-usage ledger'
type: 'feature'
created: '2026-11-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'bb71ee6dabbae03626758cec45fa34b15dcfc564'
context: []
---

<frozen-after-approval reason="authorized fifth optimization">

## Intent

The fifth process optimization makes future token costs attributable and comparable. Replace temporary usage totals with a durable local ledger and a small report/attribution CLI. The owner's instruction to start this optimization authorizes implementation; preserve the existing uncommitted first-four optimization files.

## Boundaries & Constraints

Scope: project-local Python tooling, moderate ambiguity and impact; review_risk high because accounting, concurrent hooks, and retries affect infrastructure. Keep game code and rules unchanged. Use Python standard library compatible with the configured `/usr/bin/python3`; no new dependencies. No deployment, external writes, automatic billing estimate, historical import, or fabricated live hook events. Do not commit the owner's accumulated optimization work.

Use SQLite under `.codex/usage/` with an ignore rule. Default location derives from the hook's repository, not the invocation cwd. Preserve diagnostic routing/usage lines. Hook failures report concise diagnostics without blocking development. Never persist prompts, arbitrary raw events, or raw error text. Counts and model identity come only from actual hook fields; absent data stays null. Labels are explicitly manual attribution, never runtime evidence.

## I/O & Edge-Case Matrix

| ID | Input/state | Expected behavior |
| --- | --- | --- |
| U01 | PostModelRequest with actual usage | Persist timestamp, session/turn/root/parent/agent IDs when supplied, actual model/effort, status, error-present flag, usage and attribution provenance; print concise diagnostics |
| U02 | Partial or absent usage | Preserve missing fields as null; derive total only from both known input and output; cached is included in input and reasoning in output; do not add either twice |
| U03 | Repeated stable response ID | One counted response; later known fields may enrich missing usage; reports never count duplicate callback twice |
| U04 | No stable response ID; identical attempts | Preserve each observation and mark identity/deduplication unavailable; do not deduplicate by model/turn/counts or claim exact attempt counts |
| U05 | Concurrent root/child writers, missing turn/session IDs | Atomic SQLite writes; no shared unknown bucket that combines unrelated counters; identity and totals retain explicit uncertainty |
| U06 | Manual attribution | CLI stores story/phase/retry-cause labels scoped by session/turn and optionally agent for subsequent observations; snapshot labels per observation so later labels do not silently rewrite prior attribution; runtime-provided fields take precedence |
| U07 | Report | Group by model, role, story, phase, or status with optional session filter; aggregate root plus children while keeping guardian work distinguishable; report known subtotal AND missing-field counts, unidentifiable observation count, status counts, and zero-data state |
| U08 | Bad input or unwritable/corrupt ledger | Hook returns normally with a concise warning; malformed input is ignored safely; report CLI errors are explicit and nonzero, never a clean/zero-usage claim |

</frozen-after-approval>

## Code Map

- `.codex/hooks/model_usage.py`: existing hook entry, alias handling and unsafe temporary turn aggregation. Preserve supported token aliases; replace temporary read-modify-write counters.
- `.codex/hooks.json`: existing UserPromptSubmit, PreModelRequest, PostModelRequest commands; no event registration changes needed.
- `.codex/README.md`: document real hook limitations, ignore behavior, report/label commands, unknowns, and absence of verified billing rates.
- `_bmad/custom/verification-evidence.md`: test evidence ownership. Existing hook registration may need runtime trust after content changes; do not assume telemetry is live.
- Official source: https://learn.chatgpt.com/docs/hooks documents per-attempt model/turn/agent fields plus optional status, error and token_usage. It does not guarantee response IDs, story or phase; preserve optional fields if supplied and otherwise report unknown.

## Tasks & Acceptance

- [x] `.codex/hooks/model_usage.py` and optional shared `.codex/hooks/usage_ledger.py`: durable concurrent ledger and diagnostic adapter implementing U01–U05/U08.
- [x] `.codex/hooks/usage_report.py`: read-only reporting plus explicitly manual label command, U06–U08.
- [x] `.gitignore`, `.codex/README.md`, `AGENTS.md`: ignore local records, document commands and attribution workflow without inventing runtime fields.
- [x] `.codex/hooks/tests/test_usage_ledger.py`: meaningful unit/integration tests of pure accounting/storage/report helpers using temporary databases. Never invoke live hook main with fabricated events; fixtures must never enter the repository's usage ledger.

Acceptance: Given actual hook events, when development proceeds, then later reporting reads durable categorized observations with honest uncertainty. Given cached and reasoning counts, when aggregated, then neither is double-counted. Given concurrent callbacks or missing identifiers, when writing/reporting, then data is not lost or falsely merged. Given manual labels, when the runtime lacks story/phase, then attribution is visibly manual and scoped; actual model/usage is never overridden.

## Verification

Run `python3 -m unittest discover -s .codex/hooks/tests -v`; expect U01–U08 coverage, concurrent writes, duplicate enrichment, identityless attempts, label scoping/snapshot, missing counts, token aliases, empty reports, and explicit storage errors. Run report CLI on the real ledger only in read-only mode: absence means no recorded usage, not zero cost. Run `git diff --check`; inspect Markdown links, ignored ledger paths and unchanged game/scenario files. Parent reads diff and test output. No game tests needed unless game code changes.

## Implementation Notes

- Scope: project-local tooling; moderate ambiguity and impact. `review_risk: high` because SQLite transactions, retry identity, accounting and shared hook behavior need correctness, edge-case and verification review. No game/rule/scenario files changed. Existing optimization work and hook registration were preserved; no commits made.
- Storage/report helpers use the standard library with nullable counts, response-ID upserts and identityless observations. Manual scoped labels merge updates, snapshot on observation, and yield to actual runtime attribution. Diagnostic adapter does not retain prompts or errors. Protected `.codex` edits used approved filesystem escalation.
- Implementer owns required full verification. Pure-helper tests use temporary databases; no fabricated live hook event or historical import was performed. Runtime callbacks independently populated the ignored local ledger during work.

## Verification Evidence

Tested state: HEAD `bb71ee6dabbae03626758cec45fa34b15dcfc564` plus content SHA-256 `3378f4c6d601d3e19aae1fd3cba039c436d9d49f7f48c0d1a71e48d9463cd54e`. Reproduce with sorted unique `git ls-files -co --exclude-standard -z` file paths, hashing UTF-8 path + NUL + contents + NUL for every existing file. Exclude only this evidence/status spec and `opt-05-verification.log` (the log records exact excluded paths and the entire input manifest). The digest includes existing uncommitted optimization inputs and all executable/test/config changes; ignored runtime ledger data is not a verification input.

All commands ran in `/Users/ngotrieuphong/Projects/ai-repos/family-monopoly`. [Inspectable output and input manifest](opt-05-verification.log) records each exit code and actual test output. Python on PATH: 3.15.2; registered hook interpreter `/usr/bin/python3`: 3.9.6. Temporary SQLite fixtures, no additional dependencies.

| Command / check | Tested state | Environment | Outcome / coverage | Evidence |
| --- | --- | --- | --- | --- |
| `python3 -m unittest discover -s .codex/hooks/tests -v` | HEAD + digest above | Python 3.15.2 | Exit 0; 19 passed, 0 skipped; U01–U08, aliases, nullable accounting, concurrent separate/same-response writers, duplicate enrichment, manual label scoping/merge/snapshot, corrupt storage and explicit errors | [Full output](opt-05-verification.log) |
| `/usr/bin/python3 -m unittest discover -s .codex/hooks/tests -v` | Same | Python 3.9.6 | Exit 0; same 19 tests passed, 0 skipped; actual hook interpreter compatibility | [Full output](opt-05-verification.log) |
| `/usr/bin/python3 .codex/hooks/usage_report.py report` | Same code; live ledger snapshot at verification | Python 3.9.6; read-only real ledger | Exit 0; 60 actual observations across 2 model groups (`gpt-6-luna` 1, `gpt-6.1-sol` 59); 60 observations lack stable response IDs. Known total subtotal 6,477,124; not exact attempts or billed cost. Snapshot may grow as callbacks continue. | [JSON snapshot](opt-05-verification.log) |
| `git diff --check` | Same | Git | Exit 0; no whitespace errors | [Output](opt-05-verification.log) |
| `git check-ignore .codex/usage/ledger.sqlite3 .codex/usage/ledger.sqlite3-journal .codex/usage/ledger.sqlite3-wal .codex/usage/ledger.sqlite3-shm` | Same | Git | Exit 0; all ledger and sidecar paths ignored | [Output](opt-05-verification.log) |
| `git diff --name-only -- specs src tests`; Markdown-link inspection | Same | Git + Python helper | Exit 0; no game/scenario changes; all local AGENTS/README links exist and official hook documentation was read. Matrix U01–U08 maps to named test cases. | [Inspection output](opt-05-verification.log) |

Open gates: none for this authorized slice. Existing runtime hook registration has produced real callbacks in the recorded snapshot; a future runtime trust change or absent callbacks must still be treated as unavailable evidence. Stable response identity is unavailable in the current live records, so exact attempt counts and billing costs remain unknown by design. The high-risk correctness, edge-case, and verification-gap reviewers completed; verified findings were patched and affected checks rerun.

### PR preparation verification — 2026-11-08

The owner authorized committing the accumulated optimizations, creating a PR, and marking EPIC-002 complete. This supersedes the earlier no-commit boundary for this delivery. The epic tracker, story detail, backlog and implementation notes now agree with the existing Done evidence; B-09 human reviews remain open and the optional retrospective remains unrun. No game behavior or scenario contract changed.

Tested state: HEAD `bb71ee6dabbae03626758cec45fa34b15dcfc564` plus content SHA-256 `62db837d40aea1b9994bf20d7b4c436024c2794a998358c23ad200b4f4d1546d`, using the same hashing procedure and two evidence/status exclusions above. This is the PR-preparation state, including the epic-completion documentation; the earlier digest and log remain historical evidence for OPT-05's implementation/review.

| Command / check | Tested state | Environment | Outcome / coverage | Evidence |
| --- | --- | --- | --- | --- |
| `python3 -m unittest discover -s .codex/hooks/tests -v` | PR-preparation digest above | Project macOS environment, Python on PATH | Exit 0; 19 passed, 0 skipped; U01–U08 | PR-preparation tool output; named cases match the implementation log above |
| `/usr/bin/python3 -m unittest discover -s .codex/hooks/tests -v` | Same | Registered hook interpreter | Exit 0; 19 passed, 0 skipped; U01–U08 | PR-preparation tool output |
| `uv run .agents/skills/bmad-sprint-planning/scripts/sprint_plan.py validate --status-file _bmad-output/implementation-artifacts/sprint-status.yaml` | Same | Project macOS environment | Exit 0; `valid: true`, no problems or legacy statuses | PR-preparation JSON output |
| `git diff --check`; `git check-ignore` for ledger and journal/WAL/SHM paths | Same | Git | Exit 0; no whitespace errors; all four runtime paths ignored | PR-preparation output |
| Python local-link, TOML and scenario inspection | Same | Python standard library | 50 local Markdown link targets exist; customization TOML parses; `src`, `tests` and `specs/features` unchanged | PR-preparation output and PR diff |

Current-turn runtime model/token evidence is unavailable. Historical observations in the original verification log are not attributed to this PR-preparation turn. Game/browser suites were not rerun because this delivery changes process tooling and status documentation only; historical game acceptance remains scoped to its recorded implementation state.

## Review Triage Log

| Finding | Verdict | Evidence and route |
| --- | --- | --- |
| CR-1 duplicate total uses discarded conflicting input | medium | Verified in record merge: incoming derived total is copied before retained input/output are reconciled. Input 10 then conflicting input 999/output 2 gives total 1001. Patch retained-count derivation. |
| CR-2 guardian enrichment retains subagent:unknown | medium | Verified role update only accepts unknown or root, excluding subagent:unknown despite newly supplied guardian agent_type. Patch role enrichment. |
| EC-1 duplicate total inconsistency | medium | Same demonstrated code path as CR-1. Grouped with CR-1 for one fix. |
| EC-2 unknown child role remains after actual type arrives | medium | Same demonstrated code path as CR-2. Grouped with CR-2 for one fix. |
| VG-1 report grouping assertions only check nonempty output | medium | Reviewer read suite and traced CLI consumer: wrong model-only grouping would survive existing assertions. Patch distinct group names, subtotals, missing counts and source assertions. |
| VG-2 uncertain roles lack assertions | medium | Reviewer verified no assertion for agent-ID-only or parent-linked-without-type shapes. Patch stored/reported unknown-role regression cases and enrichment case. |

Review dispatch: high risk; all three lenses used isolated contexts with the current model capability. No review layer failed. Four grouped patch items; no deferred findings. Parent verified correctness/edge claims against the inspected code; verification-gap claims accepted with their filed test/search evidence. Resolution: duplicate totals now derive from retained input/output or retain explicit runtime totals; child roles enrich when agent type arrives; report tests assert group keys, subtotals, missing counts and attribution provenance. Parent reran all 19 tests on Python 3.15 and 3.9; all pass.
