---
title: 'ST-503 · Cards, auctions and transaction feedback'
type: 'feature'
created: '2026-11-14'
status: 'in-review'
baseline_commit: 'b5ee67134af4cf3b2d1959dacfdbd35b1c4a32ef'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/specs/epics/EPIC-005.md'
  - '{project-root}/specs/design/game-ui/DESIGN.md'
  - '{project-root}/specs/design/game-ui/EXPERIENCE.md'
  - '{project-root}/specs/adr/ADR-007-renderer-proposal.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-st-204-cards-payments-and-auctions.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Accepted card draws, payments, and auctions already resolve on the server, but their current general outcome list does not give these moments the focused presentation established in the approved table design. Add coordinated card, auction, and payment views that explain the accepted event and next legal choice while keeping the board and responsible actor in context.

## Boundaries & Constraints

**Always:** Derive card text and results only from published accepted events and the authorized public snapshot. Preserve legal commands, actor eligibility, explicit bidder handoffs, command identity, retries, revisions, reconnect, and reduced-motion behavior. Keep native HTML controls and readable status. Use project-authored visuals and copy, and record provenance.

**Never:** Change rules, amounts, profiles, server settlement, auction order, actor authorization, hidden-card visibility, or existing command payloads. Do not include portfolio, trade, debt, jail, acquisition, finish, audio, or broader recovery redesign reserved for ST-504/505.

## I/O & Edge-Case Matrix

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Published card | A newly accepted CardDrawn event is in synchronized history | The local table renders the new revision | A focused card surface shows the published Vietnamese card text and accepted effect context. It never predicts hidden cards or delays legal next actions. |
| Payment | An accepted RentPaid, PaymentSettled, or BankPaid event and its public snapshot | The event is presented | The focused feedback identifies payer, recipient or bank, amount, cause when available, and resulting affected balances. |
| Pending auction | The public snapshot has a property or building auction | An eligible actor receives the device | The table shows the auction item, current leader and bid or opening minimum, the acting bidder, cash context and existing legal bid/pass controls. |
| Auction result | Accepted settlement or all-pass events are synchronized | The outcome view updates | It names the winner, item and amount, or that the item remains with the bank. It appears once and comes from accepted state. |
| Refresh or synchronization gap | A decision or recent event is restored or resynchronized | The current snapshot and history return | The surface reflects the latest authorized state without replaying a transaction or exposing unrevealed information. |

</frozen-after-approval>

## Code Map

- src/web/local.js owns accepted-event summaries, history, actor selection and synchronization. Extend its projections and retain revision/deduplication boundaries.
- src/web/local-controls.js contains current auction bid/pass controls and handoff state. Restyle or reorganize these controls while preserving existing commands and server-owned eligibility.
- src/web/local.html and src/web/style.css define the ST-502 decision sheet and native HTML surfaces. Keep the board visible and these surfaces responsive.
- src/web/local-vi.js and src/domain/vn-original-content.js provide existing Vietnamese labels, card copy, values and authored profile data. Reuse without changing content or rules.
- scripts/local-play-acceptance.js is the existing real-route browser acceptance entry point. Per the user's instruction, do not run tests or add verification code for this slice.

## Tasks & Acceptance

**Execution:**
- [x] src/web/local.html and src/web/style.css — add focused native card, auction and transaction surfaces coordinated with the approved table and responsive decision sheet.
- [x] src/web/local.js and src/web/local-controls.js — project accepted card, payment and auction state into those surfaces and retain current handoffs and command controls.
- [x] src/web/local-vi.js, specs/research/licensing.md, specs/research/sources.md, specs/ui-ux.md, specs/epics/EPIC-005.md, sprint tracker — reuse authored copy and record implementation, traceability and original provenance.
- [x] Keep ST-504/505 surfaces and behavior outside this implementation.

**Acceptance Criteria:**
- Given a newly accepted card event, when its revision is rendered, then the player sees the published card and accepted result while legal actions remain available without a required animation.
- Given an accepted payment, when the focused result appears, then payer, recipient or bank, amount, available cause, and resulting balances match the synchronized public state.
- Given an eligible auction bidder, when the auction is pending, then the surface names the item, current leader and minimum, preserves the legal bid/pass actions, and requires the existing actor handoff.
- Given a settled or all-pass auction, when its accepted revision is rendered or replayed, then the correct outcome appears once and never implies a client-side settlement.
- Given 360px portrait and desktop/landscape viewports, when cards, transactions, or auctions are active, then board context, text, and native actions remain reachable without horizontal overflow.

## Implementation Notes

Single presentation goal spanning existing event projection, auction controls, and local HTML layout. The approved EXPERIENCE contract and completed ST-204 behavior settle the visual and event semantics. No migrations, external effects, or public API changes are needed. The user explicitly requested implementation without testing; do not run tests or builds.

## Spec Change Log

## Review Triage Log

## Design Notes

Reuse the approved card-reveal, auction-deed, and payment-result hierarchy from specs/design/game-ui/EXPERIENCE.md. Keep a card's published text and result together. Keep the pending auction's live leader/minimum and responsible actor together. Use the existing outcome/history as durable text so a transient overlay never becomes the only record.

## Verification

Not run at the owner's direction. No tests, builds or browser checks were performed. Responsive layout and acceptance remain unverified.
