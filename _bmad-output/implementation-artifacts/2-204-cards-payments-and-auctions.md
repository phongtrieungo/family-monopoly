# ST-204 · Cards, payments and auctions

**Status:** Done · **Backlog:** B-14 · **Epic slice:** S4 · **Depends on:** ST-203 (Done).

Implementation and review are complete under the approved ST-204 build spec. All listed verification passed; broader B-09 human and distribution gates remain separate.

## User story

As a family, we can see why money moves, what a card says and who is bidding without interpreting an activity log.

## Scope

- Present contextual reveals for drawn cards and payment feedback with drawer/debtor, creditor, amount and resulting state. Show only card information revealed by accepted events; preserve retained release-card, pending-debt, multi-seat collection, and hidden deck-order behavior.
- Present auction status and explicitly select each eligible bidder on the shared device. Show current bid, legal bid/pass choices, and accepted settlement through the existing server-authoritative command path.
- Provide equivalent accessible text and announcements. Motion is optional, skippable, and never controls a transaction or settlement.
- On refresh, reconnect, event gaps, duplicate events, and lost responses, reconcile to the authoritative snapshot and receipt without replaying a payment or settlement.

## Acceptance criteria

1. A card is displayed only after an accepted reveal event. Retained release cards, pending debt, and a resumed multi-seat collection preserve their existing semantics and visibility; unrevealed deck order remains private.
2. Rent, repairs, and other payments identify the payer, recipient, amount, and accepted resulting state. A lost response, reconnect, or duplicate event produces exactly one ledger effect and no false second payment.
3. Each eligible local auction bidder can explicitly choose their seat and submit a legal bid or pass. Minimum price, affordability, high bidder, final pass, all-pass, and the final outcome match server state; settlement occurs once and the original turn owner resumes afterward.
4. Card, payment, and auction outcomes remain understandable and operable with reduced motion or skipped animation, keyboard, and touch. Native HTML controls and announcements provide the equivalent information.
5. Refresh and synchronization recovery restore the current decision and latest revision without exposing unrevealed cards or resubmitting a committed transaction.

## Existing acceptance contracts

- Domain/profile behavior: AC-12–15, AC-18, AC-22 in [full-match.feature](../../specs/features/full-match.feature).
- Shared-device auction, retry/recovery, and accessible operation: AC-35, AC-36, AC-38 in [local-play.feature](../../specs/features/local-play.feature).
- Rule and policy trace: R-03–05; DP-01–04 and DP-08. See [rules](../../specs/rules.md), [turn state](../../specs/turn-state.md), and [authored profile](../../specs/research/content-profile.md).

## Constraints

- Keep the engine deterministic and server-authoritative. Do not change rules, digital policies, reducer behavior, settlement semantics, or profile data in this presentation slice. Any approved behavior change requires corresponding spec and scenario updates.
- Keep Phaser as a projection of accepted state and preserve equivalent native HTML information and controls. Do not expose credentials, private deck order, or unrevealed card content.
- Preserve existing match recovery, command idempotency, visibility, and shared-device handoff boundaries.

## Dependencies and exit evidence

ST-203 is complete. Before closing this story, run the relevant domain and browser checks for the slice, preserve existing regression coverage, and record deterministic card/payment/auction scenarios, duplicate-response results, keyboard/touch and reduced-motion observations, command outcomes, and any open review gates. B-09 human, fluent-reader, branding, screen-reader, physical-device, balance, and distribution reviews remain separate gates.
