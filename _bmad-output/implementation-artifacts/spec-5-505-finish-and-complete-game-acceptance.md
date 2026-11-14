---
title: 'ST-505 · Finish and complete-game acceptance'
type: 'feature'
created: '2026-11-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'dafa9722959e52c699253b7e1470fdb013a299f9'
context:
  - '{project-root}/specs/epics/EPIC-005.md'
  - '{project-root}/specs/design/game-ui/DESIGN.md'
  - '{project-root}/specs/design/game-ui/EXPERIENCE.md'
  - '{project-root}/specs/epics/EPIC-002-stories.md'
  - '{project-root}/scripts/local-play-acceptance.js'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The local table can reach an authoritative finished state, but the final shared-table experience and complete-game acceptance need a cohesive finish, optional sound control and responsive refinement.

**Approach:** Present the confirmed winner and final public seat state as a durable, accessible ending on the existing table. Add opt-in original synthesized effects with a persistent-in-view mute control. Verify full local journeys without changing game rules or server outcomes.

## Boundaries & Constraints

**Always:** Show victory only from the server-recorded Finished state after all mandatory acquisition choices. Keep the complete final seat/asset summary and history available; never auto-reset. Make sound opt-in, short, original and nonessential, with visible mute state and text equivalents. Respect reduced motion, skip, focus, keyboard, touch, zoom and responsive layout. Preserve accepted-state projections and existing idempotent retry/reconnect behavior.

**Never:** Change rules, settlement, winner selection, commands, persistence, public visibility or scenario IDs. Do not add music, downloaded audio, new dependencies or third-party assets. Do not infer a winner from solvent-seat count or make animation/audio produce or delay game outcomes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Finished match | Authoritative `Finished` snapshot and `winnerSeatId` | Focus a clear victory heading; show final public balances/assets and durable history; leave new match deliberate | Refresh/replay does not duplicate celebration or change result |
| Delayed completion | Bankruptcy has remaining mortgage-acquisition obligations | Keep the pending actor, property and choice visible; show victory only after server records Finished | Reconnect restores the obligation; never announce early |
| Optional sound | User activates sound control | Short original synthesized effects play only for supported accepted presentation events; control clearly toggles mute | Audio unavailable or autoplay blocked leaves complete text feedback and usable controls |
| Reduced motion / skip | OS preference or user skip | Resolve presentation immediately to the same accepted state and focus | No gameplay command or state transition is tied to animation |
| Complete local match | Two or four seats, normal and recovery decisions | Existing real-route flows reach an authoritative ending and retain a playable, readable summary | Saved command identity, handoff, stale rejection and refresh recovery remain unchanged |
| Responsive ending | Desktop, tablet, 360px portrait and 200% zoom | Board/context and final summary remain reachable without horizontal overflow or hidden actions | Vertical scrolling is allowed when needed; preserve visible focus |

</frozen-after-approval>

## Code Map

- `src/web/local.js` -- confirmed finish transition, durable summary, optional sound control and presentation-only lifecycle.
- `src/web/local.html` -- native accessible sound toggle and finish controls.
- `src/web/local-board.js` and `src/web/style.css` -- reduced-motion-safe presentation and responsive finish layout.
- `src/web/local-vi.js` -- concise Vietnamese control/status copy.
- `scripts/local-play-acceptance.js` -- existing ST-206 complete-game route and acceptance extension.
- `specs/ui-ux.md`, `specs/epics/EPIC-005.md`, sprint tracker -- delivery and traceability.
- `src/domain/vn-original-turn.js` -- authoritative completion rules; inspect only, do not modify.

## Tasks & Acceptance

**Execution:**
- [x] Present the confirmed victory, final seat state and durable history with no automatic reset or premature announcement.
- [x] Add opt-in synthesized sound and an accessible mute control; text and controls remain complete when muted or unavailable.
- [x] Refine finish layouts and motion behavior for required viewports, keyboard, touch and reduced motion.
- [x] Extend existing complete-game acceptance coverage and update story traceability without changing scenario IDs.

**Acceptance Criteria:**
- Given a finished match, when the accepted snapshot is rendered or restored, then the server winner and final public summaries are visible, focus is useful, and the state remains unchanged.
- Given pending mortgage acquisition after bankruptcy, when the match is restored, then the responsible actor and obligation remain visible and no winner is announced until the server records completion.
- Given sound is initially disabled, when the user enables or mutes it, then only supported original effects play and mute state is explicit; unavailable audio never blocks gameplay or information.
- Given reduced motion, skip, refresh, retry, keyboard use, touch, 360px width or 200% zoom, when the ending is entered or revisited, then the same accepted outcome and all essential information remain available without duplicate effects or commands.
- Given two- and four-seat complete-game journeys, when accepted bankruptcy/acquisition decisions resolve, then the browser acceptance flow reaches the authoritative terminal state and retains its summary.

## Implementation Notes

Scope / ambiguity / impact: bounded presentation and local acceptance extension over existing finish semantics. Medium impact with high regression sensitivity around delayed victory, saved retries, event replay and accessibility. Design source is the approved EPIC-005 and EXPERIENCE contract. Owner approved writing this story before implementation.

- Added an explicit sound toggle to the decision sheet. It starts muted each page load, uses short Web Audio oscillator tones only after user opt-in, and plays one brief finish cue for a newly accepted MatchFinished event. It does not persist preference or replay for restored finished state. Audio failures leave the visual feedback available. Muting immediately silences active tones.
- Final summaries wrap inside the decision sheet, and the optional celebration uses a single short animation with a static reduced-motion equivalent. The browser runner exercises the finish, restored result, and sound preference with unavailable audio.

## Spec Change Log

## Review Triage Log

## Design Notes

Keep final summary and history durable. Optional celebration is short, user-started and stoppable. Audio starts muted on every page load; no preference is persisted outside the current view. Use only synthesized effects authored in code. Do not play effects for restored historical events or duplicate receipts.

## Verification

Run `bun test`, `bun run build:web`, and `bun scripts/local-play-acceptance.js --st-206`, then the existing default, `--st-203`, `--st-204` and `--st-205` browser paths if implementation changes shared local shell behavior. Cover complete two/four-seat journeys, delayed acquisition, refresh/retry, muted/unavailable audio, reduced motion, 360px and desktop layouts, keyboard focus and 200% zoom. Record tested state and outcomes in Verification Evidence. Preserve B-09 physical-device, screen-reader, fluent-reader and family gates as open unless separately evidenced.


## Verification Evidence

Ran from the repository root on macOS arm64 with Bun 1.4.4 and Chrome 157.0.8103.52. Browser runs used a temporary store and the production local HTTP routes. The default and ST-204 runs used the final runner selectors. ST-203, ST-205 and ST-206 passed before the final selector edits, which were confined to the other two paths.

| Command | Result |
| --- | --- |
| `bun run build:web` | Passed. |
| `bun test` | 69 passed, 0 failed. |
| `bun scripts/local-play-acceptance.js --st-206` | Four checkpoint journeys passed with two and four seats at 1440px keyboard and 360px touch with reduced motion. Covered delayed victory, retry, final summaries, reload, celebration and the muted-by-default sound toggle with unavailable audio. |
| `bun scripts/local-play-acceptance.js` | Passed the core and recovery flows and the viewport matrix, including emulated 200% reflow. |
| `bun scripts/local-play-acceptance.js --st-203`, `--st-204`, and `--st-205` | Passed turn, transaction, auction and portfolio/recovery regression paths. |
| `git diff --check` | Passed. |

Audible playback, physical devices, native browser zoom, screen readers, fluent-reader review and family observations were not assessed. B-09 remains open. Runtime hook model and token evidence was unavailable.
