---
title: 'ST-502 · Playable table and core turn'
type: 'feature'
created: '2026-11-14'
status: 'in-review'
baseline_commit: 'fbc44ae70a332a461436b5870c4540a690ed4d52'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/specs/epics/EPIC-005.md'
  - '{project-root}/specs/design/game-ui/DESIGN.md'
  - '{project-root}/specs/design/game-ui/EXPERIENCE.md'
  - '{project-root}/specs/adr/ADR-007-renderer-proposal.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Bring the approved Vietnamese neighborhood table into the shared-browser match. Connect the Phaser board, seat summaries and native decision surface so 2–4 people can play from setup through purchase and rent while retaining access to every full-match action.

## Boundaries & Constraints

Reuse the existing local routes, command validation, revisions, receipts, sessions, saved matches and public snapshot boundaries. Keep Phaser 3.90 with Canvas fallback and native HTML equivalents. Render only accepted outcomes. Skip and reduced motion reconcile to the same state. Keep art original and record provenance. Scope dedicated card and auction redesign, management redesign, victory polish and audio to ST-503–505. Preserve B-09 human gates and the separate private-room experience.

## I/O & Edge-Case Matrix

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| AC-33 setup | No match, or a retained match | Players enter 2–4 names and start | The table shows the actual seats. Replacing a retained match requires explicit confirmation. |
| AC-04/06 and AC-34 core turn | A player has acknowledged the device handoff | They roll, buy, then end the turn | The accepted dice, destination, deed, price, cash and owner are readable. The next seat confirms a named handoff before committing. Landing on the owned property displays accepted rent with payer, recipient and amount. |
| AC-36 recovery | A purchase is pending or its response is lost | The tab refreshes or the user retries | The table reconciles the saved decision and revision, preserves the original intent where uncertain, and requires handoff before new commitments. No duplicate settlement or success animation follows a stale or rejected command. |
| AC-35/37 full match | A non-core decision is pending | The responsible actor uses the native controls | Auction, card, trade, jail, building, debt, acquisition and finish remain operable in the table's styled decision surface. |

</frozen-after-approval>

## Code Map

- `src/web/local.html` and `src/web/style.css` hold the local shell and shared styles. Scope new presentation to the local page.
- `src/web/local.js` owns accepted state, outcome text, actor selection, handoff, sync, retry and focus. `src/web/local-controls.js` owns the native decision controls. Reuse both paths for core turns and the remaining phases.
- `src/web/local-board.js` projects accepted snapshots and roll motion. Refer to `design/game-ui/mock.js` for approved original art geometry and token shapes. Keep the native space list and history authoritative.
- `scripts/local-play-acceptance.js` already exercises real browser commands through the local HTTP routes with deterministic fixtures. `test/local-play.test.js` covers actor, revision, retry and redaction.

## Tasks & Acceptance

- [x] `src/web/local.html`, `src/web/style.css` — compose setup, linked HUDs, board and actor decision sheet. Use native dialogs for space and history inspection, with focus return.
- [x] `src/web/local-board.js` — project the 40-space fixed oblique neighborhood, distinct seat shapes and accepted ownership/development. Keep existing accepted-dice and movement behavior.
- [x] `src/web/local.js`, `src/web/local-controls.js`, `src/web/local-vi.js` — wire seat summaries and purchase context from current state, keep readable rent and recovery feedback, and preserve existing phase inputs and focus behavior.
- [x] `scripts/local-play-acceptance.js` — extend the existing browser runner with layout and focus assertions and the matrix above wherever existing assertions leave a gap.
- [x] `specs/epics/EPIC-005.md`, `specs/ui-ux.md`, `specs/research/licensing.md`, `specs/research/sources.md`, sprint tracker — record delivery, traceability and original art provenance. Preserve existing scenario IDs and acceptance expectations.

- Given 1440×900, 1280×720 and 1024×768, when a normal turn or purchase is shown, then HUDs, board and primary decision fit without page scrolling.
- Given 768×1024 or 360×800, when a decision is open, then the board stays above an internally scrollable sheet with no horizontal overflow.
- Given keyboard, touch, reduced motion or 200% zoom, when playing or inspecting, then all native actions and 40-space details remain reachable, focus is visible, and accepted results remain readable.

## Implementation Notes

Scope spans the local renderer, layout and accessible controls. Ambiguity is bounded by the ST-501 contracts. Impact is medium for presentation with high-risk regression boundaries around focus and recovery. Planning used bounded read-only discovery. Implementation needs cross-layer verification and review against the completed diff. No migrations or external side effects are required.

## Spec Change Log

- 2026-11-14. Implemented the local neighborhood table, linked seat summaries, native inspection/history, and accepted purchase and recovery presentation. The purchase footer remains visible beside the board in landscape and below the board in portrait while the deed scrolls independently.
- Replacement confirmation applies to retained finished matches as well as unfinished matches. Retry uses the original saved intent and opens a fresh handoff before new commitments.

## Review Triage Log

Review risk is high because the presentation changes touch actor handoff, synchronization and retry gating.

| Finding | Verdict | Resolution |
| --- | --- | --- |
| A retry rejected at the same revision could hide the handoff and leave controls disabled. | High | Retry completion now refreshes the handoff. A focused Chrome run demonstrated recovery after a same-revision rejection. |
| Updating purchase buttons removed the native group legend. | Medium | Updates now remove only those buttons, preserving the fieldset's accessible name. |

The three independent review lanes reached the runtime usage limit. The correctness lane supplied the retry finding before stopping. The owner requested basic final checks.

## Verification

The implementer owns `bun test`, `bun run build:web` and the local browser suite. Run `bun scripts/local-play-acceptance.js` and the same command separately with `--st-203`, `--st-204`, `--st-205` and `--st-206`. Set `CHROME_BIN` to the installed browser when needed. Verify the five named layouts, zoom, keyboard, touch, reduced motion and Canvas fallback. Capture the accepted turn and purchase against the mock, including narrow layout. Check local links, scenario mapping in `specs/features/{turn,local-play,full-match,interface}.feature` and `git diff --check`. Record commands, output and tested content digest in Verification Evidence. Parent checks the captures and acceptance mapping. Physical-device, screen-reader and family acceptance remain B-09 checks.

## Verification Evidence

The commands ran from the repository root. The local browser used deterministic dice and deck order, a temporary file store, the real local HTTP routes, and Google Chrome headless.

- Tested tree `fbc44ae70a332a461436b5870c4540a690ed4d52` plus SHA-256 `eeed34809d559b2fe7ba344f2aeae59228da3824346ef680ef3f8704eafabc2e`. The digest covers all modified and untracked inputs against HEAD, excluding this spec and the sprint status tracker because they contain workflow metadata and evidence only. [Input manifest](../../../../../../../tmp/family-monopoly-st502-evidence/tested-state.log), [Digest and trace checker](../../../../../../../tmp/family-monopoly-st502-evidence/inspect.py).
- Environment Darwin arm64, Bun 1.4.4, Phaser 3.90.0 and headless Chrome 157.0.8103.52 with `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. [Runtime versions](../../../../../../../tmp/family-monopoly-st502-evidence/environment.log).

| Command or check | Result and coverage | Inspectable evidence |
| --- | --- | --- |
| `bun test` | Exit 0, 69 passed, 0 failed, 379 expectations. Includes local actor, revisions, exact retry, persisted pending decisions and redaction. | [unit.log](../../../../../../../tmp/family-monopoly-st502-evidence/unit.log) |
| `bun run build:web` | Exit 0, bundled the local renderer. | [build.log](../../../../../../../tmp/family-monopoly-st502-evidence/build.log) |
| `bun scripts/local-play-acceptance.js` | Exit 0. AC-04/06/10/33–38, including forced Canvas, independent 3- and 4-seat setup, named handoff, buy and same-property rent, lost Buy response with reload and exact retry, stale Roll with no motion or event, and existing non-core decisions. | [browser-default.log](../../../../../../../tmp/family-monopoly-st502-evidence/browser-default.log) |
| `bun scripts/local-play-acceptance.js --st-203` | Exit 0. Committed dice and movement, skip, start award, forced jail, reduced motion, refresh and 40-space native list. | [browser-st-203.log](../../../../../../../tmp/family-monopoly-st502-evidence/browser-st-203.log) |
| `bun scripts/local-play-acceptance.js --st-204` | Exit 0. Cards, payment, auction handoff and settlement, accepted receipt retry and event-gap recovery. | [browser-st-204.log](../../../../../../../tmp/family-monopoly-st502-evidence/browser-st-204.log) |
| `bun scripts/local-play-acceptance.js --st-205` | Exit 0. Debt, exact retry, stale rejection, trade review edits, acquisition, keyboard and touch handoff. | [browser-st-205.log](../../../../../../../tmp/family-monopoly-st502-evidence/browser-st-205.log) |
| `bun scripts/local-play-acceptance.js --st-206` | Exit 0, four saved-checkpoint journeys. Two and four seats with keyboard and 360px touch, replacement cancel and confirmation, retry and authorization, final acquisition, winner, retained summaries and motion. | [browser-st-206.log](../../../../../../../tmp/family-monopoly-st502-evidence/browser-st-206.log) |
| `python3 /tmp/family-monopoly-st502-evidence/inspect.py links` | Local Markdown paths and named anchors resolve. | [links.log](../../../../../../../tmp/family-monopoly-st502-evidence/links.log) |
| `python3 /tmp/family-monopoly-st502-evidence/inspect.py trace` | Exit 0, all 33 scenario IDs across turn, local-play, full-match and interface are mapped against their existing expectations. | [trace.log](../../../../../../../tmp/family-monopoly-st502-evidence/trace.log) |
| `git diff --check` | Exit 0. | [whitespace.log](../../../../../../../tmp/family-monopoly-st502-evidence/whitespace.log) |

The default browser run verifies 1440×900, 1280×720 and 1024×768 landscape views without page scrolling. At 768×1024 and 360×800 it verifies the board above the internal decision scroller, both purchase actions visible, and zero horizontal overflow. The 200% reflow check halves the CSS viewport and doubles device pixel density through Chrome DevTools. Keyboard Tab, Enter and Escape and emulated touch verify native inspection, action reachability and focus return. Device emulation provides browser evidence. A physical-device pass, native browser zoom pass, screen-reader pass, fluent-reader and family acceptance remain open.

| Browser capture | Playable table | Approved ST-501 mock |
| --- | --- | --- |
| Turn | [1440](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-turn-1440.png), [1280](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-turn-1280.png), [1024](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-turn-1024.png), [768](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-turn-768.png), [360](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-turn-360.png) | [1440](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-mock-table-1440.png), [360](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-mock-table-360.png) |
| Purchase | [1440](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-purchase-1440.png), [1280](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-purchase-1280.png), [1024](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-purchase-1024.png), [768](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-purchase-768.png), [360](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-purchase-360.png) | [1440](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-mock-purchase-1440.png), [360](../../../../../../../tmp/family-monopoly-st502-evidence/family-monopoly-st502-mock-purchase-360.png) |

Browser capture review confirmed the shallow oblique neighborhood and upright structures, attached seat summaries, paper decision sheet and dock, and paired portrait purchase footer. The playable captures show the real accepted Sân nhỏ Hà Nội roll and deed. The mock shows its illustrative Ngõ hoa Hà Nội scene. The compact deed details scroll within the production sheet while the purchase actions stay visible.

### Final checks after review fixes

Baseline `fbc44ae70a332a461436b5870c4540a690ed4d52`, SHA-256 `b14b884fa5083e44700b2cb8453fffc48857a1d5ca8fcb38dea12d0744375a60`. The final tree passed `bun test` (69 passed), `bun run build:web` and `git diff --check`. The earlier browser matrix above applies to its recorded pre-fix digest. Full browser reruns were omitted at the owner's request.

The root runtime hook identified `gpt-6.1-sol` and supplied per-request token counts. Stable response identity was unavailable for deduplication.
