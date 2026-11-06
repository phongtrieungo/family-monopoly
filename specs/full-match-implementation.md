# B-08 full-match domain and room implementation

The internal `vn-original-v1` engine implements the [authored content profile](research/content-profile.md) and the C1009 procedures at the [reviewed locators](research/edition-review.md). DP-01–10 remain explicit digital policies. Fluent-reader, balance, branding and public distribution review remain open. No third-party board or card data is bundled.

## Selection and persistence

Configure `createRoomService` with `vnNeighborhoodBoard`, `vnOriginalRules` and `startingCash: 1200` from `src/domain/vn-original-content.js` to select the original profile. This is an internal service configuration. The private-room browser adapter continues to select the synthetic prototype. [B-10 local play](local-play.md) now exposes the authored full-match controls on one shared browser with separate acceptance evidence.

Start records setup rolls (including tied-leader rerolls), private shuffled deck orders and a private content snapshot. A match keeps its pinned content rather than looking up a newer catalog on every command. `createVnOriginalMatch` plus the original setup rolls, deck permutations, accepted commands and recorded roll outcomes reconstruct the same domain state. Production randomness comes from the server; domain tests inject fixed outcomes.

The room service derives actors from sessions, checks receipts before revisions, atomically persists state and receipts, and preserves all decisions across disconnects and file-store reopening. Public projections include debts, acquisition choices, building demand, retained release cards and the winner. They exclude decks, initial deck permutations, the continuation queue and the private content snapshot. Published events reveal drawn cards and accepted rolls only.

## Commands and decisions

All room submissions retain `{ id, expectedRevision, type, payload }`. The table shows payloads for original-profile commands. IDs are stable space IDs, group IDs or card IDs from the authored profile. Connection recovery uses the existing reconnect path.

| Command | Payload | Guard or result |
| --- | --- | --- |
| Roll, Buy, Decline, EndTurn | `{}` | Active seat and matching phase. Ordinary doubles require another roll; the third sends the seat to jail. |
| Bid / Pass | `{ amount }` / `{}` | Eligible bidders only. Opening bid 10, final passes and one settlement. No unrelated command during auctions. |
| PayJail / UseReleaseCard | `{}` / `{ cardId }` | Jailed active seat before rolling. Double escape moves without granting an extra roll. Third failure saves movement behind the fee obligation. |
| Mortgage / ReleaseMortgage | `{ spaceId }` | Owner and lawful undeveloped group. Release requires available cash and no pending debt or acquisition decision. |
| SettleDebt / Bankrupt | `{}` | Current debtor only. Settlement writes one transfer and resumes saved work. Bankruptcy requires insolvency after available mortgages and prior building sales. |
| ChooseMortgage | `{ choice: "keep" or "release" }` | Acquiring owner only. Saves one mandatory bank obligation before continuation. |
| Build / SellBuilding | `{ spaceId }` | Complete unmortgaged group for construction; even construction and sale; physical bank stock. |
| LiquidateHotels | `{ groupId, finalCounts }` | Owner during a shortage, with exactly the available replacement houses distributed evenly in board order. |
| BuildingDemand | `{ spaceId: ID or null }` | One explicit target or decline per invited seat. Pending responses survive disconnects. |
| BuildingOffer | `{ accept: boolean }` | Sole remaining requester accepts the normal price or releases the reservation. |
| OfferTrade | `{ targetSeatId, give, receive }` | Each side contains `{ cash, properties: [IDs], cards: [IDs] }`. Current holdings and funds are validated. |
| AcceptTrade / CancelTrade | `{}` | Named recipient confirms the still-valid offer; either participant may cancel. Only one offer is pending at a time. Transfers are atomic, then acquired mortgages pause for choices. |

The queue contains serializable payment, movement, card-return, acquisition and turn-continuation tasks. A payment leaves the queue before it becomes the saved debt, so settling never replays an earlier payment. In-flight cards return only after their work finishes. Bankruptcy cancels queued transfers involving the eliminated seat, keeps prior transfers, transfers or returns retained cards, and resolves creditor acquisition obligations before testing for a winner. Bank-owned bankruptcy deeds enter sequential auctions while multiple solvent seats remain.

## Acceptance traceability

| Contracts | Executable coverage |
| --- | --- |
| AC-11–13 | `test/vn-original-turn.test.js`: rent debt, opening price and auction spending rejection |
| AC-14–16 | Domain card continuation, retained card and replay cases; `test/vn-original-rooms.test.js`: durable recovery and hidden deck state |
| AC-17–23 | Domain forced jail, repairs, creditor-specific bankruptcy, acquisition interest, interrupted gifts and final victory; room acquisition receipt retry |
| AC-24–27 | Domain last-building auction and DP-10 liquidation; room disconnect, stale revision and demand recovery |
| AC-28–32 | Domain jail attempts, ordinary doubles, confirmed trades, separate service roll and physical building conservation |
| AC-01–10 | Existing synthetic domain/room tests and the separately recorded [B-06 browser evidence](prototype-acceptance.md) |

Run `bun test` using the pinned Bun 1.4.4. The implementation does not promote reviewed or provisional rule claims to edition-verified status. Wider playtesting still requires the language, balance, physical-device and distribution gates above.

## Verification evidence

Verified with Bun 1.4.4 on 2026-11-06 using `bun test`. Local Markdown links, unchanged scenario IDs, AC-11–32 test traceability and diff whitespace are checked at handoff. Full-match browser and physical-device acceptance are not claimed by this domain/server run.
