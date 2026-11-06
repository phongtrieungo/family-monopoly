---
title: 'ST-204 Cards, payments and auctions follow-up verification'
type: 'chore'
created: '2026-11-06'
status: 'done'
review_loop_iteration: 0
baseline_revision: '7c47c8d7718d72a7ef029d0cbb79d15df8f76ca2'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-st-204-cards-payments-and-auctions.md'
  - '{project-root}/_bmad-output/implementation-artifacts/2-204-cards-payments-and-auctions.md'
  - '{project-root}/specs/local-play.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The completed ST-204 work has several accepted-event and recovery paths whose correctness depends on the browser displaying exactly the state represented by the server's revision. A follow-up pass should confirm that the review fixes remain in place and that the focused browser flow still covers the observable behavior.

**Approach:** Reconcile the implemented card, payment, and auction outcome UI against accepted events and public snapshots, run its real-browser acceptance flow, and repair only a concrete mismatch found in that pass.

## Boundaries & Constraints

**Always:** Use the existing accepted events, public snapshots, local browser flow, and server-authoritative commands. Preserve Vietnamese authored copy, event ordering, actor handoff, hidden deck order, retry receipts, deduplicated resync, and desktop/mobile accessibility.

**Never:** Change rules, reducers, settlement semantics, authored profile data, actor eligibility, or unrelated stories. Do not create a second source of truth or infer a transaction from presentation state.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Card chain | Accepted card draws with a later movement or debt | Card copy remains ordered; only the final draw receives current position context and debt is associated by source ID. | No later card consequence is attributed to an earlier draw. |
| Payment and award | Accepted rent, card payment, or `StartAwarded` with resulting snapshot | Cause, affected balance, and accepted award match the public state. | Do not invent a payment or award when its accepted event is absent. |
| Auction completion | Accepted property/building settlement or all-pass result | Outcome names the property/building and matches ownership/buildings in the snapshot. | Do not infer a target or winner absent accepted evidence. |
| Recovery | Refresh, lost response, duplicate history, or event-gap resync | Same final summary and decision restore; one rendered payment and no replay announcement. | Preserve last synced view and lock commands until recovery. |

</intent-contract>

## Code Map

- `src/web/local.js` -- `renderOutcome()` projects accepted history and current snapshot; `cause()`, `balances()`, and `describe()` format accepted results. `syncNow()` reconciles revisions, deduplicates event history, and suppresses announcements during resync. Read-only contracts: do not change reducers or command behavior.
- `src/web/local.html` and `src/web/style.css` -- `#local-outcome` is the labeled result region; verify it remains visible and responsive at 360 CSS pixels.
- `scripts/local-play-acceptance.js` -- `--st-204` exercises the local page with deterministic server fixtures, including chained cards, payment retry, auction settlement, duplicate history, and phone recovery.
- `src/domain/vn-original-turn.js` and `src/rooms/service.js` -- authoritative events, snapshots, receipts, and settlement; inspect as read-only contracts if a presentation mismatch appears.
- `specs/epics/EPIC-002-stories.md` -- stable ST-204 scope and existing acceptance IDs; do not change story scope in this follow-up.

## Tasks & Acceptance

**Execution:**
- [x] `src/web/local.js` and `scripts/local-play-acceptance.js` -- reconcile the displayed outcomes with accepted event/snapshot contracts and the follow-up matrix; no concrete mismatch was observed.
- [x] `scripts/local-play-acceptance.js` -- run the focused browser flow at desktop and 360px with keyboard, touch, reduced motion, retry, and event-gap recovery; every matrix row is asserted and passed.
- [x] `specs/epics/EPIC-002-stories.md` and `_bmad-output/implementation-artifacts/sprint-status.yaml` -- confirmed the stable ST-204 scope and completed status remain unchanged.

**Acceptance Criteria:**
- Given any matrix row, when its real browser acceptance scenario runs, then the visible outcome agrees with the accepted events and public snapshot.
- Given the current implementation already satisfies every row, when the follow-up is complete, then no unrelated code or story scope changes are introduced and the verification evidence is recorded.
- Given a concrete mismatch, when corrected, then its focused browser assertion fails without the fix and passes with it, while existing unit/build regressions still pass.

## Review Triage Log

### 2026-11-07 — Review pass
- verdicts: 3 findings — high 0, medium 2, low 1, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` The offline recovery flow did not assert the last synced summary remained visible and unchanged while disconnected — added visible/text/dimension equality assertions; the focused browser flow passed.
  - `[medium]` `[patch]` The chained-card flow did not assert authored card-copy order — added assertions for VN-C07 followed by VN-M11; the focused browser flow passed.
  - `[low]` `[reject]` The 360px screenshot result was not recorded in this spec — the review protocol rejects findings whose fix is a spec edit; the required finalization notes now record that the screenshot was inspected and the outcome was visible without horizontal overflow.
- intent alignment: `st-204` supports continuing implementation or a follow-up verification reading; this pass implements follow-up verification of the already completed story, and the UI browser surface was exercised without changing production code.

## Auto Run Result

- **Summary:** Rechecked the completed ST-204 projection against its accepted-event and recovery matrix. No production mismatch was found; added browser assertions for card-copy ordering and preserving the visible summary during disconnection.
- **Files changed:** `scripts/local-play-acceptance.js` adds the two review assertions; this follow-up spec records scope, evidence, and review triage.
- **Review:** Two medium patch findings applied and passed; no findings deferred. One low documentation-only finding was rejected under the review rule for spec-edit fixes; its visual check was performed and recorded here.
- **Follow-up review recommendation:** `true` because this first pass patched two medium findings. Residual unverified risk: screen-reader announcement behavior and physical-device presentation remain outside this browser emulation run.
- **Verification date:** 2026-11-07.
- **Verification:** `bun test` passed (68 tests, 363 assertions); `bun run build:web` passed; focused `--st-204` Chrome acceptance passed including the new card-order and offline-view assertions; `git diff --check` passed. Inspected `/tmp/family-monopoly-st204-phone.png`: the outcome region is visible, wraps at 360px without horizontal overflow, and the pending action remains below it.
- **Residual risks:** Screen-reader, fluent-reader, physical-device, branding, balance, and distribution review remain separate B-09 gates.

## Verification

**Observed 2026-11-07:**
- `bun test`: PASS, 68 tests / 363 assertions.
- `bun run build:web`: PASS.
- Focused Chrome `--st-204`: PASS in the parent session using the approved localhost route. The context-free implementation subagent initially encountered a sandbox bind error, but no application failure reproduced after the parent reran the command.
- `git diff --check`: PASS.
- Matrix audit: Card chain is covered by chained-draw order, source-matched debt, and last-card destination assertions; payment/award by cause, balances, and accepted Start award assertions; auction completion by property and building targets plus all-pass ownership assertions; recovery by reload, lost-response retry, duplicate rendered history, and event-gap resync assertions. The focused browser run passed all four rows.

**Commands:**
- `bun test` -- expected: all 68 tests pass.
- `bun run build:web` -- expected: browser bundle builds successfully.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun run scripts/local-play-acceptance.js --st-204` -- PASS: card chain, rent/card payment and balances, Start award, property/building/all-pass auctions, reload, retry, duplicate history, event-gap resync, disconnect recovery, keyboard, reduced motion, and visible 360px outcome.
- `git diff --check` -- expected: no whitespace errors.

**Manual checks:**
- Compare the visible summary and snapshot-backed balances/ownership during the focused browser run; inspect the 360px screenshot for overflow or hidden outcome content.
