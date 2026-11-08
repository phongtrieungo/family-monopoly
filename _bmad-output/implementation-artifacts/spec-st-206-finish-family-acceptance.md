---
title: 'ST-206 Finish and family acceptance'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: ['AGENTS.md', 'specs/local-play.md', 'specs/epics/EPIC-002-stories.md']
baseline_commit: '00aadf96228a86e43f32bab7d88b55d418e4120a'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Families can reach a server-recorded winner, but the current view provides only a winner line and restart hint, while other labels still suggest an active turn. There is no cohesive finish summary or focused two- and four-seat acceptance evidence.

**Approach:** Complete ST-206 as B-16 with a clear Vietnamese finish scene, an optional celebration, an authoritative end summary and the existing new-game path. Exercise representative scripted journeys and explicitly separate automation from real family observations.

## Boundaries & Constraints

**Always:** Consume accepted snapshots/events; show victory only for server `Finished` with its recorded winner after mandatory obligations. Preserve actor credentials, revision checks, retries, hidden deck order, accessible HTML, keyboard/touch and reduced motion. Retain the existing session-storage behavior: refresh resumes the match, confirmed replacement clears only this browser's local session keys, and server retention remains unchanged.

**Never:** Change reducers, profiles, tabletop rules, winner calculation or retention policy; calculate rankings or invented game statistics; deploy, import uncleared assets, or claim B-09 human approvals. Family observations remain an explicit open gate unless actual participants provide evidence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Final rival eliminated | Bankruptcy with mortgage obligations outstanding | Keep acquisition decision visible; finish only after server obligations resolve | Rejected or stale intent preserves accepted state and decision |
| Finished snapshot | Recorded winner and final seats/holdings | Name winner, thank all players and show each player's final cash, properties and bankruptcy status without ranking | No gameplay controls or misleading active-turn labels |
| Refresh / repeated sync | Same finished revision or restored saved session | Same summary and winner; no automatic celebration replay or duplicate payment | Failed sync retains last view and existing recovery controls |
| New game | Finished or unfinished local match | Finished can return to setup; unfinished requires existing confirmation and cancellation preserves session | Do not delete server records or silently replace unfinished play |
| Optional celebration | User chooses to celebrate or skip; reduced motion enabled | Nonblocking original CSS treatment, immediate readable result, reduced-motion static equivalent | No timer or animation callback changes state or submits commands |

</frozen-after-approval>

## Code Map

- `src/web/local.js`: `render`, `locks`, saved state and `new-local` handler own winner text, handoff, recovery and session reset. Preserve exact-command retry and sync paths; remove turn-only labels in Finished.
- `src/web/local.html`, `src/web/style.css`: winner region and layout; add semantic summary, focusable heading and optional celebrate/stop controls with 44px targets.
- `src/web/local-board.js`: center text currently says whose turn it is unconditionally; project finished state consistently without changing token positions or authority.
- `src/web/local-controls.js`: already suppresses gameplay when Finished. Preserve this guard.
- `scripts/local-play-acceptance.js`: existing Chrome/CDP keyboard/touch harness, setup, seed, snapshot and screenshot helpers; setup currently hardcodes four names. Fixtures use a temporary file store and production HTTP/UI paths.
- `test/vn-original-turn.test.js`: AC-23 already proves victory waits for acquired-mortgage obligations. `test/local-play.test.js` covers setup, authorization, revision and retry contracts.

## Tasks & Acceptance

**Execution:**
- [x] `src/web/local.js`, `src/web/local.html`, `src/web/style.css`, `src/web/local-board.js` — implement finish summary, consistent labels, transition focus and optional celebration; preserve restart semantics and avoid focus stealing during periodic sync.
- [x] `scripts/local-play-acceptance.js` — add `--st-206` with two- and four-seat setup and representative desktop/360px touch journeys through turn, purchase, auction, card, debt, trade, reconnect and finish. Clearly label seeded checkpoints rather than claiming an uninterrupted naturally played match.
- [x] `test/local-play.test.js` — cover any extracted summary behavior and terminal command guard through meaningful state/HTTP assertions; reuse existing AC-23 domain coverage.
- [x] `specs/local-play.md`, `specs/features/local-play.feature`, `specs/epics/EPIC-002.md`, `specs/epics/EPIC-002-stories.md`, `specs/backlog.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml` — preserve IDs, record B-16 traceability/results and family gate; reconcile stale ST-204 tracker status against recorded Done evidence.

**Acceptance Criteria:**
- Given final bankruptcy with an acquired mortgage, when mandatory choices resolve, then winner appears only at server Finished and no further gameplay commands are offered (R-08, AC-23, AC-37).
- Given two or four seats, when scripted desktop keyboard and 360px touch journeys run, then accepted outcomes match snapshots and unauthorized/stale attempts and duplicate retries have recorded revision/event evidence without duplicate effects (AC-16, AC-33–38).
- Given finish, refresh, repeated sync or reduced motion, when the result is viewed, then summary, board, announcements and focus agree without replaying celebration or hiding essential information (AC-36, AC-38).
- Given an unfinished game, when new-game confirmation is canceled, then the same saved match remains; when replacement is confirmed or a finished game is replaced, then setup returns without changing server retention.

## Implementation Notes

- Scope classification: bounded presentation and acceptance work; medium ambiguity/impact because finish, focus and recovery cross UI/HTTP paths. Reducers, content profiles, winner calculation and retention policy are unchanged.
- Added an authoritative seat-order finish summary with cash, named holdings (mortgages/buildings) and bankruptcy status; removed terminal active-turn labels from HTML and Phaser. Finish focus happens on entry, while periodic sync retains user focus.
- Celebration is original CSS, opt-in and immediately stoppable/skippable, with a static reduced-motion equivalent. It never submits commands or affects accepted state. Exact saved-command retry remains available when needed.
- Added `--st-206` for 2/4 seats × desktop keyboard/360px touch with saved checkpoints, production routes, sanitized revision/event evidence and four captures. Stabilized browser setup navigation, native confirmation responses, foreground touch gestures and bounded CDP requests. Supplementary replacement setup explicitly uses keyboard; primary touch journeys use native synthesized touch gestures.
- Added HTTP coverage for final bankruptcy/acquisition, identical terminal receipt retry and rejected terminal commands; retained existing AC-23 reducer coverage.
- Updated B-16 traceability and preserved IDs; reconciled ST-204's stale sprint tracker to its recorded Done evidence. Implementation, acceptance and review fixes are complete as recorded below; B-09 human gates remain open.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and route |
| --- | --- | --- |
| Finished refresh omitted the live announcement | medium | Verified: an unchanged restored revision bypassed `syncNow`'s update branch. **patch** — `render` restores the recorded winner announcement when it is empty. Focused Chrome matrix rerun passes. |
| Summary checks did not tie holdings to their owner rows | medium | Verified. **patch** — browser acceptance derives expected holdings from the accepted saved snapshot and compares each seat row's named holdings and mortgage annotation. |
| Touch checkpoints used keyboard handoff | medium | Verified: `seed` did not receive the journey's input mode. **patch** — it now propagates touch through handoff. |
| Phaser terminal projection was not asserted and could overflow long names | medium | Verified. **patch** — bounded wrapped center text is exposed as the renderer's read-only projection dataset and asserted by the browser acceptance route. |
| Finish recovery, active celebration polling, direct victory, and complete keyboard traversal were not covered | low | Deferred: these are useful additional acceptance permutations, but the implemented scope already has focused terminal refresh, retry, mortgage-delayed victory, keyboard/touch controls and full regression evidence. Record as future browser-harness expansion, not a release blocker. |

## Verification

Observed 2026-11-07: Bun 1.4.4; Chrome 156.0.8078.81. `bun test` passes 69 tests (379 assertions); web build passes. Focused ST-206 and full local AC-33–38 browser runs pass, as does the synthetic private-room browser regression. The initial sandbox could not open a loopback server; authorized browser checks ran with the required local-server permission. Earlier harness diagnostics exposed raw touch acknowledgement and repeated setup-input issues; the final runner uses native synthesized touch gestures and explicitly reported keyboard submission for supplementary replacement setup. No diagnostic timeout is claimed as a passing run.

Focused sanitized evidence: both widths reject unauthorized/stale rolls with 400/409 at revision 1; lost Buy response retries retain revision 3 and exactly one PropertyBought event. Two-seat acquisition waits at revision 16 then finishes at 17; four-seat acquisition waits at 18 then finishes at 19. Each records one SeatBankrupted and one MatchFinished. A stale acquisition choice preserves the decision. The finish summary, focus, normal/reduced-motion celebration, Skip/Stop, refresh, repeated sync and local-only replacement semantics pass. Captures and detailed limits are recorded in [local-play.md](../../specs/local-play.md#st-206--b-16-finish-acceptance--2026-11-07).

Real family observations remain OPEN; no B-09 human approval is claimed. Runtime hook model/usage output was not supplied; model and token evidence are unavailable.


- `bun test` — domain, room, local and synthetic regression tests pass.
- `bun run build:web` — bundled Phaser projection builds.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun scripts/local-play-acceptance.js --st-206` — focused two/four-seat finish journeys and captures pass.
- Same command without `--st-206` — existing AC-33–38 browser regression passes.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun scripts/prototype-acceptance.js` — synthetic private-room browser regression passes.
- `git diff --check` plus local Markdown link and scenario-ID traceability checks on changed documents — no whitespace, broken links or lost IDs.
- Record browser/version, viewport, input, reduced-motion/skip behavior, fixtures, sanitized revision/event evidence and captures. Record real family observations separately or leave the gate open. Report only available runtime hook model/usage evidence.
