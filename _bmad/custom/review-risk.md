# Review effort by risk

Before dispatch, inspect the complete target diff, including new files, and classify scope, ambiguity, and impact. Record `review_risk` as low, medium, or high with a one-sentence reason in the existing review summary. Unknown risk defaults to high. Reclassify when the diff changes; use the highest risk present across a mixed diff. Do not spawn a separate classifier.

| Risk | Qualification | Correctness | Edge cases | Verification gaps |
| --- | --- | --- | --- | --- |
| Low | Bounded prose, formatting, or decorative styling with no changed behavior, rules, controls, focus, visibility, contracts, dependencies, or test expectations | Always | Skip | Skip |
| Medium | Bounded presentation/control behavior with understood effects and unchanged authoritative rules, transactions, persistence, and visibility | Always | Skip | Run |
| High | Engine/determinism, actor/revision validation, retries/idempotency, reconnect/persistence, hidden information, transaction semantics, public contracts, shared infrastructure/dependencies, broad changes, or unresolved impact | Always | Run | Run |

Use the full build route for medium/high risk; the oneshot route is only appropriate for low risk. If review reveals higher risk on a oneshot change, report the uncovered risk and resume through the full route before claiming review complete. Do not silently accept its single lens as full coverage.

The configured layer instructions enforce this selection: announce skipped layers and the reason before collecting results. Build-auto retains its intent-alignment auditor at every risk. Standalone code review retains its acceptance auditor whenever a spec is supplied. Parent acceptance/matrix checks, required verification, same-model review rules, and failure reporting still apply. An explicit request for additional lenses takes precedence; risk sets the minimum, not a cap.

Expand `{project-root}`, `{skill-root}`, and all input paths to absolute paths before dispatch; never leave template placeholders in a child prompt. Send only the text after the layer's launch-prompt label to its child; risk gating is the parent's responsibility.

Do not load the spec or claims into a blind correctness reviewer. Edge-case reviewers retain their delayed claims-read sequence. Keep independent launches isolated with `fork_turns="none"`.

There is no finding quota. Report only evidenced, reachable defects or demonstrated verification gaps within the authorized review. A clean result is valid; missing/unreadable inputs or an incomplete review must be reported as a limitation, never as clean. Parent triage still verifies and groups findings under the workflow's rules.

Recheck patches and affected behavior. Start another full review only when the workflow requires it or a named unresolved risk justifies it; do not repeat review merely because a reviewer returned no findings. This is an instruction policy, not a runtime risk classifier.
