---
title: 'ST-504 · Portfolio, trade and recovery'
type: 'feature'
created: '2026-11-14'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '67842660f30dd64e63d6d58126ba2387db87880d'
context:
  - '{project-root}/specs/epics/EPIC-005.md'
  - '{project-root}/specs/design/game-ui/DESIGN.md'
  - '{project-root}/specs/design/game-ui/EXPERIENCE.md'
  - '{project-root}/specs/local-play.md'
  - '{project-root}/specs/epics/EPIC-002-stories.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The local match already supports asset management, trade, jail, debt, mortgage acquisition and building shortage, but those decisions still appear as a collection of controls in the decision sheet. Players need a coordinated, readable path that makes holdings, obligations, the responsible actor and each choice's consequences clear.

**Approach:** Present the existing legal decisions as contextual portfolio and recovery steps over the shared table. Reuse authoritative state, existing commands and actor handoffs; preserve the server as the sole authority for eligibility, costs, stock, settlement and completion.

## Boundaries & Constraints

**Always:** Keep the local table and board context available. Show full property names, ownership, buildings, mortgage state, bank stock, cash and the relevant obligation. Preview exact consequences from the current public snapshot before commitment. Preserve actor selection and explicit handoff, native HTML controls, keyboard/touch access, reduced motion, focus, accepted outcomes, stale-command errors, saved retry identity and reconnect behavior. The server validates every action.

**Never:** Change reducers, rules, economy, command payloads, actor authorization, settlement, persisted state, visibility or scenario contracts. Do not infer a winner before mandatory acquisition decisions complete. Do not add ST-505 finish/audio work, new assets, dependencies, deployment or third-party material.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Portfolio action | Actor's owned assets, cash, buildings, mortgages and bank stock | Show legal build/sell/mortgage/redeem choices, exact amounts and constraints before submission | Keep the current selection and explain disabled actions; server rejection remains authoritative |
| Debt or jail | Pending debtor/creditor/amount, cash, liquidation choices, jail attempts/cards | Name the actor and obligation; show available settlement, liquidation, bankruptcy or release choices with consequences | Preserve context on rejection, lost response, refresh and resync; retry the saved command only |
| Trade | Proposed cash, properties, retained cards and mortgage states | Review both directions and mortgage obligations; only recipient accepts, either party can cancel | Stale/unauthorized attempts do not alter terms or committed state |
| Shortage or acquired mortgage | Demand responses, stock, target and acquisition queue | Show the required actor, available targets, auction/handoff and per-property mortgage choice/cost | Retain pending round/queue across sync; never invent stock or skip mandatory choices |

</frozen-after-approval>

## Code Map

- `src/web/local-controls.js` -- existing `propertyOptions`, asset, liquidation, debt, jail, trade, acquisition and shortage controls; organize into contextual steps while keeping command types and payloads unchanged.
- `src/web/local.js` -- `candidates`, `preferred`, `selectActor`, `submit`, `render`, `locks` and sync/retry paths; preserve actor authority, handoff, pending intent, focus and accepted-state projection.
- `src/web/local.html` and `src/web/style.css` -- native local decision sheet, responsive layout and focused surfaces; keep the board visible and retain bounded internal scrolling on narrow viewports.
- `src/web/local-vi.js` -- existing Vietnamese presentation copy; add only labels and consequence wording needed by the approved scope.
- `src/domain/vn-original-turn.js` and `src/domain/vn-original-policies.js` -- authoritative decisions and constraints; read for current behavior, do not modify.
- `specs/features/full-match.feature`, `specs/features/local-play.feature` and `scripts/local-play-acceptance.js` -- existing AC-11–32 and AC-37–38 contracts and ST-205 acceptance path; preserve IDs and behavior.

## Tasks & Acceptance

**Execution:**
- [x] Reorganize existing portfolio, trade, debt, jail, acquisition and shortage controls into contextual, consequence-first steps over the shared table.
- [x] Preserve all command payloads, server-authoritative availability, handoffs, sync/retry behavior, focus and native control equivalents.
- [x] Update ST-504 UI/scenario mapping, epic delivery record and sprint status without changing existing scenarios or unrelated story status.

**Acceptance Criteria:**
- Given an actor manages assets, when the portfolio step is open, then each property shows its full identity and current state, relevant cost/proceeds, stock and legal constraint before action.
- Given a trade or mortgage acquisition is pending, when a participant reviews it, then both trade directions and mortgage costs/decision responsibility are clear, only the recipient can accept, and required choices remain queued.
- Given a debt, jail decision or building shortage, when the eligible person receives the device, then the view identifies the obligation/attempt/stock state and offers the existing legal actions with their consequences.
- Given refresh, reconnect, lost response, stale revision, reduced motion, keyboard use or 360px width, when a pending decision is restored or operated, then context and focus remain usable, submissions stay locked until sync/handoff, and no command is replayed with a new identity.

## Implementation Notes

Scope / ambiguity / impact: one production presentation migration; the existing UX contract and ST-205 behavior define the choices. Medium risk: bounded local UI controls, with engine rules, transactions, persistence and visibility unchanged. No known irreversible effects or unresolved intent gaps. User requested implementation only; tests, builds and review are not authorized in this pass and will remain explicit open gates.

- The native decision sheet presents a selected holding with owner, building and mortgage state, stock, action amounts, projected cash and disabled reasons. Debt presents the shortfall, recovery choices, settlement and bankruptcy consequences. Hotel shortage liquidation presents the refund and resulting stock before submission.
- Trade uses the same directional summary for the frozen proposal preview and the server's pending offer. Both participants can hand off to cancel a trade during debt. Only the recipient can accept. Mortgage acquisitions show the current public property and recipient, with each subsequent obligation appearing when the server presents it.
- Jail and final-building steps show the named actor, costs and state transitions. The existing bid controls add the selected building target and cash consequences. The property selection survives in-session re-renders and the existing saved intent remains the source for retry.
- [Scenario mapping](../../specs/ui-ux.md#st-504-portfolio-trade-and-recovery) and [epic record](../../specs/epics/EPIC-005.md#st-504-delivery-record--2026-11-14) updated. Sprint and spec status remain in progress. Tests, build, browser acceptance and review were skipped at the owner's direction. Runtime hook model and token evidence were unavailable to the implementation agent.

## Spec Change Log

## Review Triage Log

## Design Notes

Use the portfolio, trade, debt and recovery hierarchy in `specs/design/game-ui/EXPERIENCE.md`. Keep the board and named responsible actor in context. A trade's reviewed snapshot must match the submitted offer; acquired mortgages remain separate decisions by the recipient. Debt liquidation is reviewed before commitment. A legal-looking control is not proof of server acceptance.

## Verification

Not run at the owner's direction. Do not run tests, builds, browser acceptance or review during this implementation pass. Existing verification gates remain open; preserve traceability to the existing full-match/local-play scenarios.
