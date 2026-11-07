# EPIC-002 · Story knowledge base

**Purpose:** detailed proposed implementation stories for the [local family game presentation epic](EPIC-002.md). This is planning, not authorization to change rules, approve assets, deploy, or implement multiple slices at once. The existing B-01–B-10, US, R and AC identifiers remain unchanged. `ST-201`–`ST-206` identify these proposed stories; their checkpoint labels are not new Gherkin acceptance IDs.

## Status and sequence

Status values: **Proposed** = scoped, awaiting selection as an authorized backlog slice; **Ready** = explicitly selected and prerequisites met; **In progress** = active; **Done** = exit criteria met with evidence and review recorded; **Blocked** = a specific dependency or decision prevents work. Update the table and the affected story's record together when status changes. A PR alone does not close unresolved evidence gates.

| Story | Epic slice | Status | Depends on | Evidence / PR |
| --- | --- | --- | --- | --- |
| [ST-201](#st-201--visual-direction-and-renderer-spike) | S1 · Visual direction and renderer spike | Done | B-08, B-10 | [Sample and comparison](ST-201-comparison.md); [ADR-007 accepted](../adr/ADR-007-renderer-proposal.md) |
| [ST-202](#st-202--game-table-and-setup) | S2 · Game table and setup | Done | ST-201 decision | B-12 · implementation complete; owner manually validated the running game |
| [ST-203](#st-203--turn-and-landing) | S3 · Turn and landing | Done | ST-202 | B-13 · focused acceptance passed; [PR #15](https://github.com/phongtrieungo/family-monopoly/pull/15) |
| [ST-204](#st-204--cards-payments-and-auctions) | S4 · Cards, payments and auctions | Done | ST-203 | B-14 · focused and full browser acceptance passed; [implementation story](../../_bmad-output/implementation-artifacts/2-204-cards-payments-and-auctions.md) |
| [ST-205](#st-205--manage-trade-and-recover) | S5 · Manage, trade and recover | Done | ST-204 | B-15 · focused and full local browser acceptance passed; UI tests and build passed |
| [ST-206](#st-206--finish-and-family-acceptance) | S6 · Finish and family acceptance | Done | ST-205 | B-16 · finish UI and focused 2/4-seat acceptance/review pass; B-09 family gate open |

**Completed slice:** ST-201 is B-11 and ST-202 is B-12. The owner manually validated ST-202 on 2026-11-06 and directed that the failing automated handoff check be bypassed. B-09 human review and wider-playtest decisions remain open; they do not imply approval of a new illustration, rule, deployment or distribution.

## Common contract for every story

- The server owns the active actor, revision, rolls, rules, transactions, command receipt and resulting state. The view renders accepted events and snapshots and sends authenticated intents. Animation never commits, modifies or blocks a game outcome.
- Continue 2–4 player shared-browser local play with separate seat sessions, explicit handoffs and auction actors. Preserve existing saved matches, board/rules version pins, reconnect, hidden deck order, lost-response retry and idempotent payments.
- Provide a keyboard-operable HTML equivalent for board and actions, turn/outcome announcements, visible focus, 44 CSS-pixel primary touch targets, reduced motion and usable 360px and desktop layouts. Animation is optional or skippable, and essential information is available without it.
- Use original or individually cleared assets; record provenance and review before import or distribution. Treat C1009 evidence, unverified rules and authored digital policies separately. Approved behavior changes require specification and scenario changes in the same slice.
- Run the slice's relevant tests and required link, whitespace and scenario-traceability checks. Record command, version, result, reviewer and limitations. Do not claim physical-device, screen-reader, fluent-reader, branding, balance or distribution approval from browser emulation.

## ST-201 · Visual direction and renderer spike

**Status:** Done · **Backlog:** B-11 · **Epic slice:** S1 · **Depends on:** B-08 and B-10 · **Outcome:** a reviewable technical and visual choice; the existing local game stays playable.

**User story:** As a family, we want the board to feel like a welcoming game so that children and adults can follow the action together.

### Scope

1. Produce one concrete original art-direction sample covering board, neighborhood groups, tokens, dice, card and action treatment. Show how color is paired with text or symbols; record origin and review of sample materials.
2. Build a bounded comparison using the same sample board, at least two distinguishable tokens and the same server-accepted movement input. Demonstrate Phaser and a React/SVG alternative sufficiently to compare layout, motion, keyboard-readable equivalents, bundle/build impact and implementation complexity. Keep both experiments isolated from normal match persistence and rules.
3. Demonstrate Phaser WebGL and Canvas fallback, resizing, reduced motion/skip and equivalent HTML. Use a pinned compatible dependency and lockfile only for an actual trial; document license and local build/serve steps. Do not rely on a CDN.
4. Capture desktop and 360px screenshots and a short motion demonstration, plus a comparison and a proposed ADR. The owner selected Phaser plus native HTML after the comparison; see accepted ADR-007.

### Acceptance checkpoints

- Same committed input produces the same displayed dice, destination and accessible text in both samples; neither renderer calculates an authoritative outcome.
- Forced Canvas rendering and the normal renderer show an understandable board and token; resize and reduced motion retain the same information. Record browser, renderer and device/emulation limits.
- The comparison records dependency/build and license consequences, observed behavior and a reasoned recommendation. Owner can inspect the actual sample and motion before selecting the direction.
- Default local match creation, resume and command behavior remain available. Existing B-10 acceptance is rerun if the spike changes its runtime path.

**Trace:** ADR-001, ADR-004–006; US-06, US-08; AC-33–34, AC-36 and AC-38; [AC-39–40 spike contracts](../features/renderer-spike.feature). **Exit evidence:** sample links, screenshots/video, comparison, chosen/remaining decision, checks and asset review. **Remaining reviews:** final illustration style, target age range, optional sound and B-09 gates.

## ST-202 · Game table and setup

**Status:** Done · **Backlog:** B-12 · **Epic slice:** S2 · **Depends on:** ST-201's documented renderer and art-direction decision.

**User story:** As a family, we can set up 2–4 people and immediately understand the board, the players and whose turn comes next.

### Scope

- Replace the form-and-dashboard presentation with a board-centered table, player areas and simple shared-screen setup. Render the full 40-space authored board, distinct tokens, current turn, balances and ownership with contextual controls.
- Present the existing per-seat handoff and shared-device trust boundary in plain Vietnamese. Keep local setup validation and idempotent creation unchanged.
- Connect the chosen renderer to the current public snapshot and a separate accessible HTML space list; preserve saved sessions and match pins.

### Acceptance checkpoints

- Starting with 2, 3 and 4 valid names creates the same authoritative profile and separate seat credentials as B-10. Invalid or duplicate names remain recoverable; setup retry does not create another match.
- At desktop and 360px, the board, active player, cash, tokens, ownership and handoff are understandable; every space, occupant and owner is available in the HTML equivalent, including the active player's location.
- A pre-existing local session reloads into its original revision and pending decision, asks for handoff again, and does not reveal deck order or credentials in public state.
- Keyboard and touch reach setup, handoff and primary actions; focus and announcements work with reduced motion. Visual assets are recorded before inclusion.

**Trace:** US-06, US-08; AC-33–34, AC-36 and AC-38. **Exit evidence:** setup/recovery browser checks, desktop/mobile captures, accessibility observations and manifest entries.

## ST-203 · Turn and landing

**Status:** Done · **Backlog:** B-13 · **Epic slice:** S3 · **Depends on:** ST-202.

**User story:** As the active player, I can see the accepted dice, follow my token, and understand the next landing decision.

### Scope

- Present handoff, roll result, movement, landing highlight and contextual buy/decline/end choices as a coherent sequence. Show the amount and consequence before submission.
- Derive motion from committed server input; reconcile to the snapshot after animation is skipped, the page refreshes or an event gap occurs. Distinguish ordinary wraparound from forced jail movement.

### Acceptance checkpoints

- Normal movement, crossing start, a double/third double and forced jail end at the server's positions and balances. No visual roll, timer or animation callback changes game state.
- Purchase or decline remains available only to the active seat at the expected revision. A declined purchase opens the existing auction. Lost responses and identical retries do not buy or charge twice.
- Refresh or skip during movement produces the correct final board and pending prompt; duplicate events do not replay a transaction. Reduced motion and keyboard/touch expose equivalent text and actions.

**Trace:** R-02–03, DP-02; AC-04, AC-06, AC-17, AC-29, AC-33–34, AC-36 and AC-38. **Exit evidence:** fixed-dice movement and retry tests, captured desktop/mobile flows and revision/event records.

## ST-204 · Cards, payments and auctions

**Status:** Done · **Backlog:** B-14 · **Epic slice:** S4 · **Depends on:** ST-203.

**User story:** As a family, we can see why money moves, what a card says and who is bidding without interpreting an activity log.

### Scope

- Add contextual reveals for drawn cards and payment feedback with drawer/debtor, creditor, amount and resulting state. Present auction status and clearly select each eligible bidder on the shared device.
- Provide an accessible, skippable presentation and an equivalent text announcement. Do not expose undealt deck order or make animation responsible for settlement.

### Acceptance checkpoints

- A card is displayed only when revealed by an accepted event; retained release cards, pending debt and a resumed multi-seat collection preserve their existing semantics and visibility.
- Rent, repairs and other payments show their recipient and amount after acceptance. A lost response, reconnect or duplicate event results in exactly one ledger effect and no false second visual payment.
- Each eligible auction seat can explicitly bid or pass. Minimum price, high bidder, affordability, final pass and final outcome reflect the server; all-pass and single-settlement paths remain usable.
- Every outcome is understandable when motion is disabled or skipped; a player can operate the same decisions with keyboard or touch.

**Trace:** R-03–05; DP-01–04 and DP-08; AC-12–15, AC-18, AC-22, AC-35–36 and AC-38. **Exit evidence:** deterministic card, payment and auction scenarios, duplicate-response checks and accessible presentation review.

## ST-205 · Manage, trade and recover

**Status:** Done · **Epic slice:** S5 · **Depends on:** ST-204.

**User story:** As a player facing a difficult decision, I can see what I own, what I owe and what each legal choice will do.

### Scope

- Restructure property, mortgage and development actions; jail exit; acquired mortgages; trade composition/confirmation; debt, bankruptcy and shortage demand into contextual steps. Preserve lawful off-turn management and explicitly chosen actors.
- Show current cash, creditor, amount, eligible actions and consequences before a commitment. Allow a user to navigate back before submitting and retain context after rejection.

### Acceptance checkpoints

- A debt flow identifies debtor, creditor and obligation and provides the server-permitted means of raising money, settlement or bankruptcy. Sufficient payment, partial liquidation and creditor acquisition continue once; no negative cash or fictitious building stock appears.
- Both sides can review trade cash, properties, retained cards and mortgage consequences; the target alone accepts and either participant may cancel. Stale or unauthorized attempts preserve the committed state.
- Jail release options, even building/sale, last-building demand and auction, hotel shortage liquidation and mortgage acquisition remain usable with correct actor handoff, amounts, stock and server guards.
- Refresh, reconnect, rejected commands and skip/reduced-motion retain the pending decision, focus and readable context. The view does not invent permission or suppress the authoritative error.

**Trace:** R-06–08; DP-04–05, DP-07–10; AC-11, AC-19–21, AC-24–28, AC-30–32 and AC-37–38. **Exit evidence:** scenario tests for each decision boundary, concurrency/retry checks, keyboard/touch evidence and unresolved copy or usability issues.

## ST-206 · Finish and family acceptance

**Status:** In progress · **Backlog:** B-16 · **Epic slice:** S6 · **Depends on:** ST-205.

**User story:** As a family, we can finish a game, understand the winner and choose whether to start another game.

### Scope

- Add a respectful, optional celebration, clear server-recorded winner and end-of-game summary. Keep the current confirmation before replacing an unfinished local game.
- Run a representative end-to-end internal acceptance with 2 and 4 seats and collect family observations separately from automation. Do not expose credentials, unrevealed cards or personal data in shared evidence.

### Acceptance checkpoints

- Winner is shown only after mandatory server obligations finish; no further gameplay command is presented as accepted after `Finished`. New-game and refresh behavior preserve the selected retention policy and existing match semantics.
- Scripted desktop and 360px touch-emulated journeys cover setup, handoff, roll, purchase, auction, card, debt, trade, reconnect and winner, with revision/event evidence for an unauthorized or stale command and duplicate retry. Existing B-10 and synthetic private-room regression coverage remains green.
- Reduced motion, skipped animations, focus, readable board/decisions and announcements preserve the same outcome. Record browser, viewport, input mode and any saved fixtures used.
- Record age range, number of players, device, observed confusion and outcomes only when real participants provide that information. Do not claim family, physical-device, accessibility, language, branding or distribution approval without named B-09 evidence.

**Trace:** R-08; AC-16, AC-23, AC-33–38; [B-09 review](../playtest-review.md). **Exit evidence:** runnable acceptance commands/results, server revision/event evidence, presentation captures, documented family observations or explicit remaining gate, and updated epic status.

## Status update record

| Date | Story | Old → new | Evidence, decision or blocker |
| --- | --- | --- | --- |
| 2026-11-06 | ST-201–ST-206 | Created → Proposed | Planning baseline; no story selected for implementation. |
| 2026-11-06 | ST-201 | Proposed → In progress | Owner requested the spike; authorized as B-11. |
| 2026-11-06 | ST-201 | In progress → In progress | Comparison and automated evidence complete; art direction and renderer proposal await owner review. |
| 2026-11-06 | ST-201 | In progress → Done | Owner selected Phaser plus native HTML; [ADR-007](../adr/ADR-007-renderer-proposal.md) accepted. Final artwork and B-09 reviews remain open. |
| 2026-11-06 | ST-202 | Proposed → In progress | Owner requested ST-202; selected as B-12. Phaser board projection and setup presentation underway; no rule or profile change. |
| 2026-11-06 | ST-202 | In progress → Done | Owner confirmed the app runs correctly in their environment and requested bypass of the automated browser handoff check. `bun run start` was reported working; `bun run build:web` succeeded. The browser runner still times out waiting for handoff controls after synthetic input; record that as a harness limitation, not a passing automated check. |
| 2026-11-06 | ST-203 | Proposed → In progress | Owner requested ST-203; selected as B-13 after ST-202 completion. Presentation work will consume committed roll events; reducer rules remain unchanged. |
| 2026-11-06 | ST-203 | In progress → Done | B-13 focused Chrome acceptance passes normal movement and Skip, crossing Start and awarding the correct amount, third-double forced jail, reduced-motion snap on the 360px touch context, refresh recovery without replay and 40-space accessibility. Live app checks confirmed mouse and keyboard handoff. Screenshots: `/tmp/family-monopoly-st203-desktop.png` and `/tmp/family-monopoly-st203-phone.png`. `bun run build:web`, 68 Bun tests and `git diff --check` pass. The broader AC-33–38 runner still has a synthetic post-refresh handoff limitation; this story's focused browser flow and live keyboard check pass. |
| 2026-11-06 | ST-204 | Proposed → Ready | Owner requested the standalone ST-204 story; selected as B-14. Story prepared from the existing S4 scope and acceptance contracts. Implementation has not started. |
| 2026-11-06 | ST-204 | Ready → In progress | Owner approved the ST-204 implementation spec; work started in the isolated `codex/st-204-cards-payments-auctions` worktree. |

| 2026-11-06 | ST-204 | In progress → Done | Focused and full Chrome acceptance, 68 tests, web build, review fixes, matrix coverage and diff checks passed. Review findings were patched or disproved and recorded in the implementation spec. B-09 gates remain separate. |
| 2026-11-07 | ST-205 | Proposed → In progress | Owner selected the ST-205 implementation spec as B-15 after ST-204; presentation changes only, with engine and rule contracts preserved. |
| 2026-11-07 | ST-205 | In progress → Done | Focused ST-205 and full local Chrome acceptance passed at desktop and 360px touch widths, including debt retry/recovery, mortgaged trade review/back/acceptance, acquisition charges, jail, development, shortage liquidation and handoffs. 68 Bun tests and web build passed. B-09 review gates remain separate. |

| 2026-11-07 | ST-206 | Proposed → In progress | Owner requested the next story after ST-205; selected as B-16. Implementation spec drafted; Build approval checkpoint pending. |

| 2026-11-07 | ST-206 | In progress → In progress | B-16 implementation and automated acceptance complete; review pending. Chrome 156.0.8078.81 passes 2/4-seat 1440px keyboard and 360px touch/reduced-motion saved-checkpoint journeys, mortgage-delayed victory, summary, refresh, optional celebration/skip and retention. Full local and synthetic browser regressions, 69 tests and web build pass. [Evidence and remaining family gate](../local-play.md#st-206--b-16-finish-acceptance--2026-11-07). No human approval inferred. |
| 2026-11-07 | ST-204 | Done → Done | Reconciled the stale sprint tracker `review` value to `done` against the existing 2026-11-06 Done record and implementation story evidence; no new closure or behavior change. |
| 2026-11-07 | ST-206 | In progress → Done | B-16 finish presentation, focused acceptance and review fixes passed. Real family observations and B-09 human gates remain open. |
