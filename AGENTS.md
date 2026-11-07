<!-- bmad:context -->
<!-- Verified 2026-11-06 against 57af615. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## family-monopoly

Specification-first family property-trading game with a shared-browser full-match mode and a synthetic private-room prototype. The web client uses Bun and Phaser with native HTML equivalents. Planning and acceptance live in `specs/`; begin with `specs/GAME-SPEC-001.md` and follow its relevant domain spec, ADRs, scenarios, and backlog item.

## Policy

- Work only on an authorized backlog slice. Implement one slice at a time; preserve requirement, rule, and scenario IDs, and update specs and scenarios alongside approved behavior changes.
- Keep unverified rules and provisional choices labeled as such. Verify evidence against the exact edition and locator before promoting a rule; keep digital policies separate from tabletop rules.
- Keep the engine deterministic and server-authoritative. Validate actor and state revision, make retries idempotent, and verify reconnect and visibility behavior.
- Use original or cleared content only. Record provenance and review in the research manifests before importing or distributing third-party material.
- Before handoff, check links, diff whitespace, and scenario traceability. Run the authorized slice’s available checks and report commands, outcomes, and open gates.

## Where things are

- Start with `specs/GAME-SPEC-001.md`; follow its linked domain spec, ADRs, scenarios, and authorized backlog item.
- For local play, Phaser is a projection of accepted state; keep equivalent information and controls in native HTML, and never let animation determine game outcomes.

## Conventions that differ from defaults

- At task start, classify each subtask by scope, ambiguity, and impact. Choose the lowest-cost available model that fits: a fast model for bounded mechanical or read-only work, a workhorse model for routine implementation and debugging, and a high-reasoning model for ambiguous architecture, cross-cutting changes, or high-consequence decisions. Do not default every task to one model, including gpt-6 Luna.
- Delegate only independent, bounded work when the coordination cost is justified. Give each delegate concise context and acceptance criteria, and choose its model tier for that subtask.
- Move to a higher model tier only when concrete failure or newly discovered complexity warrants it; carry forward useful findings instead of restarting the work.

<!-- /bmad:context -->

## Model-routing evidence

- Treat `.codex/hooks.json` output as the runtime evidence of which model handled a request. The routing policy above guides selection but is not proof that a model ran.
- Give delegated tasks a short, descriptive task name so `subagent:<agent-type>` usage lines remain attributable.
- Report token counts only when the runtime supplies them; `tokens=unavailable` means unknown, not zero.
