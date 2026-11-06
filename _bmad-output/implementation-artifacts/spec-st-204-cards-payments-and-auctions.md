---
title: 'ST-204 Cards, payments and auctions'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '72a6cd038ed7bfb86396f8285ba5225576ea69ce'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/2-204-cards-payments-and-auctions.md'
  - '{project-root}/specs/full-match-implementation.md'
  - '{project-root}/specs/local-play.md'
  - '{project-root}/specs/ui-ux.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Accepted card, payment, and auction outcomes are currently readable in general history and announcements, but the shared screen does not foreground enough context for players to understand why money moved or what the next bidder may do.

**Approach:** Present a focused outcome summary from accepted server events and the latest public snapshot. Keep the existing authenticated actor handoff and legal auction commands; improve how card causes, payers, recipients, amounts, balances, leaders, and settlement are shown.

## Boundaries & Constraints

**Always:** Server snapshots and accepted events remain authoritative. Summaries use existing event and snapshot data, preserve event order, and never submit commands. Keep accepted card visibility, retained-card behavior, hidden deck order, command receipts, revision checks, reconnect behavior, and keyboard/touch/reduced-motion equivalence.

**Never:** Change reducers, rules, digital policies, authored profile data, payment or auction settlement semantics, actor eligibility, or retry behavior. Do not reveal credentials or unrevealed cards, or replay a committed payment as an animation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Accepted card | New committed `CardDrawn` event | Show the matching Vietnamese card text and accepted result context in the focused summary and existing history/announcement. | Unknown card IDs use a safe generic label; never infer an unrevealed card. |
| Accepted payment | `RentPaid`, `PaymentSettled`, or `BankPaid` plus resulting public snapshot | Identify payer/drawer, recipient or bank, amount, cause when available, and current affected balance(s). | Missing optional source data gets a neutral cause label; do not fabricate a transaction. |
| Pending or settled auction | Auction snapshot or accepted auction events | Show property/building, current leader and bid or opening price, legal state, and accepted settlement/all-pass result. Keep explicit eligible-seat selection and handoff. | Resync to latest snapshot after rejected/stale commands; do not infer a winner. |
| Refresh, duplicate, or event gap | Persisted local view, repeated event, or resync snapshot | Restore current decision and authoritative summary without applying or announcing a second transaction; motion remains optional. | Preserve last synchronized view and disable submissions until recovery. |

</frozen-after-approval>

## Code Map

- `src/web/local.js` -- `describe()` already maps accepted card, payment, and auction events to Vietnamese; `syncNow()` appends revision history, announces events, and refreshes the snapshot. Build the focused summary here from the accepted history batch and current snapshot. `PaymentSettled.sourceId` and `RentPaid.sourceId` identify the cause; `BankPaid.cardId` identifies crediting cards.
- `src/web/local-controls.js` -- `decisionControls()` already renders the 10 xu opening minimum, affordable bids, final pass rule, eligible-seat controls, and other legal actions. Reuse its command path and preserve server guards.
- `src/web/local.html` and `src/web/style.css` -- local match action panel, existing history, and `#local-announcement` live region are the presentation and accessibility structure. Add a labeled outcome region without replacing the live announcement.
- `src/web/local-vi.js` -- contains authored Vietnamese card text, amount formatting, phases, and errors. Reuse it for result copy; add localized labels only where existing strings do not suffice.
- `src/domain/vn-original-turn.js` and `src/rooms/service.js` -- own card queues, payment events, auction commands, receipts, and settlement. Read as contracts; do not modify for this UI story.
- `scripts/local-play-acceptance.js` -- existing Chrome harness covers shared-device auction actors, retries, and phone sizing. Add an ST-204 focused flow using its deterministic server fixtures. Existing domain/room contracts are covered by `test/vn-original-turn.test.js` and `test/vn-original-rooms.test.js`.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/local-play-acceptance.js` -- add failing focused assertions for card reveal, payment cause/amount/current balances, auction leader and settlement, and refresh/retry without duplicate effects -- exercise the real local page and accepted server history before changing presentation.
- [x] `src/web/local.js` and `src/web/local-vi.js` -- derive a contextual outcome summary from committed events and the current snapshot -- keep client display a projection and reuse authored copy.
- [x] `src/web/local.html` and `src/web/style.css` -- add a readable outcome region in the action panel -- retain the existing live announcement and responsive layout.
- [x] `src/web/local-controls.js` -- adjust auction status text only where needed to make current leader, minimum legal bid, and allowed action clear -- retain existing actor handoff and command payloads.
- [x] `scripts/local-play-acceptance.js` -- complete ST-204 browser coverage for desktop, 360px touch, keyboard handoff, reduced motion, duplicate event/retry, and resync -- verify the accepted outcome matches the public snapshot.

**Acceptance Criteria:**
- Given an accepted `CardDrawn` event, when the local view updates, then it displays that card's authored Vietnamese text and never exposes unrevealed deck order.
- Given an accepted payment event, when the result is displayed, then the payer, recipient or bank, amount, cause when available, and current resulting balance(s) agree with the event and public snapshot.
- Given a pending auction, when each eligible seat takes the device and acknowledges handoff, then only legal bid/pass controls are available and the shown leader/minimum matches the server snapshot.
- Given an accepted auction settlement or all-pass result, when the view updates, then winner/property/amount or bank-retained outcome is clear and appears once.
- Given a refresh, lost response, duplicate event, or event-gap resync, when synchronization completes, then the same pending decision and final snapshot are shown without a second payment or settlement.
- Given keyboard, touch at 360 CSS pixels, or reduced motion, when players use the story's controls, then the same information and legal choices remain readable and operable without animation.

## Implementation Notes

- Added a labeled, non-live native HTML outcome region. Its latest relevant accepted history row preserves card/payment/auction event order; public snapshots supply current positions, retained-card/debt context, balances, and pending auction status. Existing card copy and event announcements remain in use; no animation or command submission is introduced.
- Payment history and announcements include safe cause labels; auction settlements name the property or final building. Auction controls retain their payloads, actor handoff and server guards while stating the minimum and final-pass consequence.
- Synchronization deduplicates revisions, rebuilds history even on a same-revision resync, and suppresses old event announcements during recovery. The last synchronized view remains visible during network failure.
- The focused browser assertions were added before presentation edits. The initial attempted red run could not reach them because the checkout lacked installed Phaser and its bundle; installed pinned dependencies and built before verification. This is not recorded as a pre-change assertion failure.
- Fixed existing acceptance fixture issues exposed by the broader run: reset saved decision fixtures to the original AwaitRoll turn, use a non-double phone purchase roll, and remove four unused scripted dice. No production rules or settlement behavior changed.

## Spec Change Log

## Review Triage Log

- **medium · patch · applied** — `renderOutcome()` could attach later chained-card debt or the final position to an earlier `CardDrawn`; only the last card now receives current position context, and debt is matched by `sourceId`.
- **medium · patch · applied** — card movement that awards money for passing Start omitted `StartAwarded`; the accepted award is now included in the focused outcome.
- **medium · patch · applied** — building auction settlement did not name its target; the summary now uses the same-revision accepted `BuildingBought.spaceId` when available.
- **medium · patch · applied** — browser coverage did not assert card destination; the focused flow compares the displayed destination to the accepted snapshot and covers chained-card debt context.
- **medium · patch · applied** — all-pass coverage checked the message but not authoritative ownership; it now asserts the property remains unowned and the auction is cleared.
- **medium · patch · applied** — duplicate-history coverage checked stored revisions but not rendered event counts; it now verifies the payment appears once in history and the outcome.
- **medium · patch · applied** — disconnect recovery did not compare the recovered outcome to authoritative state; the phone flow now checks the recovered snapshot and summary.
- **medium · patch · applied** — phone coverage did not verify the outcome region was visible; it now checks visible layout bounds at 360 CSS pixels.
- **false** — the proposed-versus-ready transition concern is disproved by the story log: it records `Proposed → Ready` on selection, then `Ready → In progress` on approval; the sprint tracker and story row agree on the active state.
- **false** — the in-review mismatch is the build workflow’s required intermediate state: step 4 sets the spec to `in-review`, and step 5 synchronizes the sprint tracker to `review` after marking the spec done. The story index uses its documented `In progress`/`Done` vocabulary and will be synchronized at that handoff.
- **medium · patch · applied** — verification-gap review found card destination, retained-card, and debt context could be removed without failing the browser flow; assertions now cover the resulting destination and chained debt association alongside card copy.
- **medium · patch · applied** — verification-gap review found text-content checks could pass with the phone outcome hidden; the focused browser flow now asserts the outcome region is visibly rendered and within the 360px viewport.

## Verification

**Observed 2026-11-06:**
- `bun test`: PASS, 68 tests / 363 assertions.
- `bun run build:web`: PASS after `bun install --frozen-lockfile` installed pinned Phaser 3.90.0.
- Focused Chrome `--st-204`: PASS for authored card/bank credit, rent cause and current balances, lost-response receipt retry, reload, auction leader/minimum/settlement/all-pass, keyboard handoff, 360px touch with reduced motion, disconnect recovery, and event-gap resync containing duplicate history.
- Full local-play Chrome regression: PASS, AC-33–38, including building auction, debt, trades, winner and phone recovery.
- `git diff --check`: PASS. Local Markdown targets in all loaded context documents resolve; scenario IDs are unchanged (AC-35, AC-36, AC-38 and existing full-match domain contracts). Post-review reruns of `bun test`, `bun run build:web`, focused ST-204 Chrome, and full AC-33–38 Chrome regression all pass.
- Inspected `/tmp/family-monopoly-st204-phone.png`: outcome text is readable without horizontal overflow, with the pending action heading retained above it. The summary is not another live region; only newly accepted events use the existing announcement.
- Open gates remain B-09 human/fluent-reader, branding, screen-reader, physical-device, balance and distribution review. Browser emulation is not physical-device approval.

**Commands:**
- `bun test` -- expected: all domain, room, and local-play regression tests pass.
- `bun run build:web` -- expected: local Phaser bundle builds successfully.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun run scripts/local-play-acceptance.js --st-204` -- expected: focused card, payment, auction, recovery, keyboard, reduced-motion, and mobile checks pass.
- `git diff --check` -- expected: no whitespace errors.

**Manual checks:**
- Confirm Vietnamese result copy, focused outcome hierarchy, focus order, and live announcements do not repeat each other or hide the pending action.
