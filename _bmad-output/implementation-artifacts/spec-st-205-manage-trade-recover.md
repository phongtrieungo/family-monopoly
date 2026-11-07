---
title: 'ST-205 Manage, trade and recover'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: ['specs/epics/EPIC-002-stories.md', 'specs/local-play.md']
baseline_commit: '05890e6'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Players need understandable, recoverable choices when managing assets, making trades, leaving jail or resolving debt. Existing server-authoritative actions and rules already cover these decisions, but the local presentation must expose them with clear context and accessible controls.

**Approach:** Close the identifiable local-play presentation gaps for ST-205 by organizing existing legal commands into contextual review and confirmation steps. Preserve the engine, profile, rule and scenario contracts; make the UI reflect accepted state and errors.

## Boundaries & Constraints

**Always:** Keep decisions server-authoritative, deterministic, revision checked and idempotent. Preserve explicit shared-device actor handoffs, pending decisions on refresh/reconnect, keyboard/touch operation, reduced motion, and native HTML equivalents to Phaser. Never fabricate permissions or change balances, stock, rules, content or settlement semantics.

**Never:** Implement ST-206, alter tabletop rules or digital policies, expose credentials or hidden information, deploy, or import uncleared content. Update specs/scenarios only if approved behavior changes become necessary.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Debt resolution | Debtor, creditor, amount, holdings and legal liquidation choices | Show consequences and permit legal liquidation, settlement or bankruptcy; accepted outcomes appear once | Rejected/stale command retains current authoritative decision and explains the error |
| Trade review | Proposed cash, properties, cards and mortgage state | Both sides review terms; target accepts; either participant may cancel | Unauthorized/stale attempt leaves committed state unchanged |
| Management and recovery | Jail, even construction/sale, last-building demand, hotel shortage liquidation or acquired mortgage; refresh/reconnect | Show eligible actor, legal options, amounts and consequences; preserve pending context and focus | Resync to authoritative snapshot without replaying a command |
</frozen-after-approval>

## Code Map

- `src/web/local-controls.js` -- renders local legal actions for assets, debt, trade, jail and acquisition; reuse existing command forms and actor selection.
- `src/web/local.js` -- projects snapshot, accessible space list, accepted events, and pending context; preserve recovery and visibility handling.
- `src/domain/vn-original-turn.js` -- authoritative reducer and legal guards; do not change reducer behavior in this presentation slice.
- `test/local-play.test.js` and `scripts/local-play-acceptance.js` -- UI coverage and browser harness; add focused `--st-205` browser flows alongside the existing `--st-203` and `--st-204` routes.
- `test/vn-original-turn.test.js`, `test/vn-original-rooms.test.js` -- domain/reconnect contracts that must remain green and unchanged in meaning.

## Tasks & Acceptance

**Execution:**
- [x] `src/web/local-controls.js` -- close verified ST-205 gaps in asset management, trade review, jail, shortage and debt choices; make consequences reviewable before submission and allow navigation back.
- [x] `src/web/local.js` -- retain pending-decision context, accessible focus and clear accepted/rejected feedback after refresh or synchronization. Existing stored-command retry and resync behavior already preserved context, focus, and authoritative errors; verified without reducer changes.
- [x] `scripts/local-play-acceptance.js` and `test/local-play.test.js` -- add focused `--st-205` browser flows and cover decision boundaries, actor handoffs, retry/recovery, keyboard/touch and reduced motion. Browser flow added; existing local-play unit coverage plus domain boundary tests remained green.
- [x] `specs/epics/EPIC-002-stories.md`, `specs/backlog.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml` -- record ST-205 as B-15 and complete after checks passed.

**Acceptance Criteria:**
- Given a debt, when the debtor reviews the obligation, then debtor, creditor and amount are clear, lawful liquidation, settlement or bankruptcy is available, and outcomes occur once without negative cash or fictitious stock (AC-11, AC-14, AC-19–20, AC-22, AC-37).
- Given a trade offer, when either participant reviews it, then cash, properties, retained cards and mortgage consequences are readable; only the target accepts and either participant may cancel; stale or unauthorized attempts do not alter committed state (AC-30, AC-37).
- Given jail, development, last-building demand, hotel shortage or mortgage acquisition, when a legal actor acts, then handoff, even-building/sale constraints, amounts, stock, auctions and acquisition charges match authoritative state (AC-21, AC-24–28, AC-31–32, AC-37).
- Given refresh, reconnect, rejection, skip or reduced motion, when a decision is restored or presented, then context remains readable and operable without replaying a committed command (AC-36–38).

## Implementation Notes

- Added an editable trade offer review with both sides' cash, property and retained-card terms, explicit mortgage keep/release costs, focus transfer to review, and a return-to-edit control. The recipient's pending-offer view repeats both sides and mortgage consequences; only the recipient sees acceptance.
- The review captures a copy of the offered terms and locks its editor until the player returns to editing, so the submitted payload cannot drift from the displayed confirmation. Mortgage copy names the seat responsible for each acquired property.
- Made debtor, creditor, amount and current cash explicit. Existing server-authoritative command, retry, actor handoff and resync behavior remained unchanged.
- Added a focused `--st-205` browser route for debt settlement and lost-response retry, trade review/back/recipient acceptance, mortgage acquisition, keyboard handoff, and touch navigation at 360px. Reducer, rules and scenarios did not change.
- Independent review findings were patched and rerun through the focused and full browser checks: submitted trade terms stay identical to the reviewed snapshot; recipient cancellation, 360px touch review/acceptance, and named mortgage decision responsibilities are covered.

## Verification

**Commands:**
- `bun test` -- expected: all existing and added tests pass.
- `bun run build:web` -- expected: web bundle builds.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun scripts/local-play-acceptance.js --st-205` -- expected: focused ST-205 flows pass at desktop and 360px touch widths; the unfiltered runner remains the broader AC-33–38 regression. This harness uses Bun APIs; running it with Node fails because `Bun` is undefined.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun scripts/local-play-acceptance.js` -- expected: broader AC-33–38 regression passes.
- `git diff --check` -- expected: no whitespace errors.

**Results (2026-11-07, Bun 1.4.4):** `bun test` passed (68 tests); `bun run build:web` passed; focused ST-205 browser acceptance passed; full local browser acceptance passed at 1440px and 360px with reduced motion; `git diff --check` passed. The harness requires Bun; the spec's original `node` invocation was corrected after Node reported `Bun is undefined`. Chrome was launched headlessly from the installed Google Chrome app. No physical-device, screen-reader or wider family review is claimed; B-09 gates remain open.

## Review Triage Log

| Finding | Verdict | Evidence and route |
| --- | --- | --- |
| BH-1: confirmation could submit terms changed after review | medium | Verified in the reviewed diff: confirmation read the live form after the review text had been rendered. **patch** — confirmation now uses a captured offer and locks the editor until the player returns to edit. |
| BH-2: changing the target while review was visible left stale copy | medium | Verified in the reviewed diff: changing the target rebuilt side inputs without rebuilding the visible review summary. **patch** — the editor is locked while the captured review is displayed. |
| EC-1: confirmation could submit terms different from the preview | medium | Verified; same live-form root cause as BH-1. **patch** — grouped with BH-1; the browser flow attempts a programmatic post-review value change and verifies the captured amount is submitted. |
| BH-3: the “edit after review” flow did not change terms after opening the preview | medium | Verified that the prior focused flow returned to editing before changing the amount, so it did not catch BH-1. **patch** — the focused flow now confirms the edited amount and verifies later form changes cannot alter the offer. |
| VG-1: verification did not mutate terms after opening the preview | medium | Verified the same test coverage gap as BH-3. **patch** — grouped with BH-3; the browser flow now attempts a post-review value change and verifies the captured amount is submitted. |
| BH-4: focused browser flow omitted recipient cancellation | medium | Verified that the focused UI route did not exercise CancelTrade even though the control was rendered. **patch** — recipient cancellation is now exercised and checks that neither balance changes. |
| BH-5: 360px flow did not operate trade review | medium | Verified that the earlier mobile route only opened trade composition. **patch** — the touch path now reviews and confirms a mortgaged trade, hands off to the recipient, accepts it and chooses the mortgage option. |
| BH-6: pending mortgage terms did not identify who pays | low | Verified that the previous copy said only “bên nhận” for each mortgage consequence. **patch** — both review summaries now name the recipient responsible for choosing and paying. |
