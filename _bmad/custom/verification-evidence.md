# Verification ownership and evidence

## Assign ownership

Before implementation, identify the required verification commands and acceptance/scenario coverage from the approved spec. Resolve a missing runner or unsupported command before relying on it; report unresolved checks as open gates. Keep this in the spec's existing Verification section without altering its frozen contract.

- Ordinary build: the implementer runs focused checks while developing and the required suite once before returning. The parent reads the diff, results, and acceptance mapping. It need not repeat an unchanged suite merely because a different agent ran it.
- Build-auto: the implementer runs focused checks; the parent runs the spec's full verification at step 03, as the workflow requires. If a spec explicitly requires the child to run a check, honor that requirement too.
- Review patches: keep the existing split of focused child checks and full parent verification after patches. Explicit workflow/spec executions always take precedence over evidence reuse.

## Record evidence

Use one compact `## Verification Evidence` section outside the spec's frozen/intent contract. Update it before workflow finalization; do not create a second tracking document or dirty a finalized worktree for evidence. Keep prior failures relevant to unresolved concerns. Each run records:

| Command / check | Tested state | Environment | Outcome / coverage | Evidence |
| --- | --- | --- | --- | --- |
| Exact command, flags, and working directory | Commit SHA for a clean tree; otherwise HEAD plus a reproducible content digest of modified and untracked verification inputs | Relevant runtime/browser versions, fixture/seed, and viewport/motion settings | Exit status, pass/fail/skip counts, and requirement/scenario or matrix rows exercised | Inspectable output reference and concise result summary |

Include application code, tests, dependencies/lockfiles, configuration, runner scripts, and fixtures in the tested state. A HEAD SHA alone does not identify dirty code. Exclude only explicitly listed evidence/status-only files from a digest; never exclude executable or expected-behavior changes. If the tested state cannot be established, mark the evidence unverified and rerun the required check before acceptance. Mark unrun or skipped checks as such, never as passed.

## Reuse and invalidation

The parent must inspect the actual output and confirm required tests executed; an agent's success summary alone is insufficient. Reuse only when the tested inputs, command, relevant environment, and expectations still match, evidence is accessible, and no unresolved concern calls for another run. Missing logs, unknown identity, changed expectations, runner/config/dependency changes, suspected flakiness, or failed/interrupted runs invalidate reuse. A new session alone does not invalidate matching evidence.

When code changes, rerun affected checks and every final check required by the workflow/spec. If impact is uncertain, run the full required suite. A focused pass does not stand in for required browser, recovery, idempotency, actor/revision, accessibility, or scenario coverage. Link, whitespace, and scenario-traceability checks remain required at handoff.

Keep routine output concise and preserve evidence references. Inspect failure details as needed. Do not rerun passing checks solely to produce a fresh summary, or repeatedly retry an unchanged environment failure; identify its cause and use the required escalation/fallback. This policy guides agent behavior; it is not an automatic test cache.
