# EPIC-006 · Local decision migration

Planned implementation contracts for the [Phaser canvas table](EPIC-006.md). Implement one selected story per session. Each story ends at its own production-path checkpoint. Use the existing [local decisions](../../src/web/local-controls.js), [session and command client](../../src/web/local.js), [Vietnamese copy](../../src/web/local-vi.js) and [full-match reducer](../../src/domain/vn-original-turn.js) as the behavior reference. Where a preview and the server disagree, inspect the reducer and the accepted scenario before migrating the preview.

## Dependencies

| Story | Owns | Depends on | Coverage |
| --- | --- | --- | --- |
| ST-604 | Decision area, core turn and jail | ST-602 | AC-04, AC-15, AC-17, AC-28–29, AC-33–34, AC-41 |
| ST-606 | Accepted card and payment feedback | ST-604 | AC-06, AC-14, AC-18, AC-22, AC-31, AC-41 |
| ST-607 | Property and building auction decisions | ST-604 | AC-05, AC-12–13, AC-35, AC-45 |
| ST-608 | Portfolio inspection and mortgage actions | ST-604 | AC-11, AC-37, AC-41 |
| ST-609 | Ordinary construction and building sales | ST-608 | AC-32, AC-37 |
| ST-610 | Last-building demand and offer | ST-607, ST-609 | AC-24, AC-27, AC-37, AC-45 |
| ST-611 | Group hotel liquidation | ST-609 | AC-25–26, AC-32, AC-37 |
| ST-612 | Trade editor, review and recipient response | ST-608 | AC-30, AC-37, AC-45 |
| ST-613 | Debt and bankruptcy | ST-606, ST-608–609, ST-611–612 | AC-11, AC-19–20, AC-22–23, AC-37, AC-45 |
| ST-614 | Mortgaged acquisition | ST-612–613 | AC-21, AC-23, AC-37, AC-45 |
| ST-615 | Per-turn accepted history and actor attribution | ST-603, ST-604, ST-606–614, ST-616 | AC-43, AC-46 |
| ST-616 | Public turn history facts | ST-603 | AC-16, AC-23, AC-46 |

Coverage comes from the existing [prototype and authored scenarios](../features/README.md) and [canvas scenarios](../features/phaser-table.feature). ST-605 follows these stories regardless of its numeric ID.

## Integration contract shared by every story

- Keep one command dispatcher and one accepted snapshot. The canvas invokes the same guarded submission and actor-selection path as the existing UI. Keep command ID, expected revision, acting credential, pending storage and retry ownership there. A retry sends the stored command and actor. A rejection or stale revision refreshes the decision from accepted state.
- For each migrated slice, extract only the needed phase or selection logic into a DOM-free function that takes the accepted snapshot, board, selected actor and any local draft. It returns Vietnamese prompt, facts and choices with stable IDs, labels, optional disabled reasons and existing command type/payload. Phaser renders those choices and uses the same IDs for focus and the accessibility bridge. Keep inspection, selection and review local. Use commit actions for command dispatch.
- During migration, expose the canvas only for the complete surface being migrated and keep the existing entry points available for unmigrated decisions. Use one live commitment surface per command. Keep the canvas decision area and nonvisual semantics synchronized from the same choice data. ST-605 completes the visible cutover.
- Scope drafts to their actor and decision subject. Preserve input and focus across same-state renders and validation failures. Revalidate on a changed revision. Clear an invalid selection or draft when the actor or subject changes. Warn about a changed offer or price before commitment. On every activation, use the current shared dispatcher guard in addition to the on-screen disabled state.
- Tests for each slice should drive the affected decisions through the existing local HTTP path with saved checkpoints and scripted dice where appropriate. Reuse checkpoint data from the [browser runner](../../scripts/local-play-acceptance.js). Keep assertions against the accepted server snapshot and revision, and exercise the canvas through pointer coordinates or keyboard focus rather than invoking a renderer callback. Add focused assertions for the extracted decision data or new public event behavior. Confirm the existing build and regression checks with the tested state at handoff.

## ST-604 · Core-turn canvas decision area

**Player outcome.** The confirmed player can take an ordinary turn from the table. The same area explains a jail turn and what happens on landing on an unowned space.

- From `candidates()`, `preferred()`, `locks()`, `submit()` and `sendPending()` in [local.js](../../src/web/local.js), expose accepted snapshot, turn owner, selected actor, confirmed holder and busy/online/pending status to the canvas. Reuse the ST-602 handoff and focus contract. Keep retry identified with the original actor even when the current prompt has changed.
- Extract the `AwaitRoll`, `AwaitPurchase` and `AwaitEnd` branches of [`decisionControls()`](../../src/web/local-controls.js:61) into the first decision-data functions. Wire `Roll`, `PayJail`, `UseReleaseCard { cardId }`, `Buy`, `Decline` and `EndTurn` to the existing dispatcher. The canvas action area supports one named prompt, a compact fact list, choices and an inline status or error. Keep later forms out of this story.
- Jail shows attempts remaining, current cash, any eligible release cards, the fee and the consequence of rolling. Show the last-attempt fee and potential debt before the roll. A separate purchase prompt uses the accepted property, price, base rent or service formula, remaining cash and the effect of passing it to auction. Inspecting the deed sends no command. Disable Buy when unaffordable.
- Show pending immediately after activation and leave the confirmed outcome to the accepted snapshot. For `Decline`, the next screen follows the accepted Auction state using the interim auction surface until ST-607.

**Exit fixtures.** Ordinary roll → buy → end turn, unaffordable purchase → decline → auction, jail fee, retained release card, failed jail roll, and lost purchase response → reload → same command ID retry. Verify wrong-holder keyboard and pointer attempts submit zero commands. Assert one purchase and charge after retry, and focus on the accepted next prompt or named handoff.

## ST-606 · Card and payment feedback

**Player outcome.** Everyone can read the accepted effect without relying on motion or sound.

- Extract display data from `renderOutcome()`, `cardOutcome()`, `outcomeItem()` and `describe()` in [local.js](../../src/web/local.js:134). Consume accepted public events in revision and intra-revision order. Keep each card's published text with the effects the accepted history can attribute to it. For an unresolved effect, show the current debt or decision and keep actual payments in accepted feedback.
- Show payer, recipient or bank, amount and cause for rent and other payments. Label cash in the current snapshot as current cash. Include separate service dice when present and the amount of an accepted start award. Preserve the summary across a device handoff.
- Update the canvas summary and announcement only for new accepted events. Resync restores readable context without replaying sound or announcing the same event as new. Detailed past-turn grouping belongs to ST-615.

**Exit fixtures.** Rent, separate service roll, immediate bank credit/debit, and a multi-seat card interrupted by debt then resumed. Open the same save with reduced motion and confirm text, event order, no duplicate announcement on retry and no unrevealed card data.

## ST-607 · Property and building auctions

**Player outcome.** A player can take the device, understand the standing bid and bid or pass for the correct lot.

- Project `turn.auction.kind`, `spaceId`, `targets`, `eligibleSeatIds` and `highBid`. Reuse `auctionMinimum()` and the existing actor selection. Name the turn owner, selected bidder, high bidder and lot separately. A building lot shows the selected bidder's target, building change and projected cash if they win.
- Use a canvas integer field with the ST-601 text/input bridge. Start at the accepted minimum. Enable `Bid { amount }` only for an eligible confirmed actor and an integer from the current minimum through available cash. Preserve an edited amount on same-state refresh and revalidate it when the high bid changes. `Pass` is available to an eligible actor other than the leader. Explain the effect of passing.
- Render accepted win, amount or no-sale outcome. Keep current bidder selection and handoff local. Server settlement and target resolution use the existing commands.

**Exit fixtures.** Property auction after decline with a different bidder, minimum and maximum boundaries, stale bid after price changes, leader Pass blocked, no-bid close, building auction with distinct targets, and refresh while a bid or pass is pending. Assert the final owner or building, balance and settlement revision.

## ST-608 · Portfolio selection and mortgage actions

**Player outcome.** A player can inspect a holding and understand exactly what mortgaging or releasing it would do.

- Reuse `propertyOptions()` and the existing mortgage amount arithmetic. Move those calculations only as needed to make them DOM-free. Show owner, group or type, development, mortgage, cash and bank stock in the portfolio sheet. Store the selected holding per actor and fall back to an owned holding or empty state after a transfer.
- Wire `Mortgage { spaceId }` and `ReleaseMortgage { spaceId }` via the shared dispatcher. Show principal or release cost, balance preview and rent consequence. Respect existing phase/eligibility restrictions, group development and affordability. Reserve a place for ST-609 actions on the selected holding.
- Keep public inspection separate from a confirmed holder's commitment controls. A source property opened from the sheet returns focus to that sheet.

**Exit fixtures.** Street, transit or service holding, mortgage blocked by a developed group, insufficient funds to release, successful mortgage and release, and debt-state mortgage. Verify actor/holding changes cannot submit against the previous selection.

## ST-609 · Ordinary construction and sales

**Player outcome.** A player sees how a normal build or sale changes the holding, stock and cash.

- Extend the ST-608 selected holding. Use the existing group, ownership, mortgage, level, stock and affordability predicates from `assetControls()`. Show cost or proceeds, before/after building level, stock and cash. Show why an uneven build or sale, mortgaged group, missing group member, insufficient cash or empty stock blocks the relevant choice.
- Dispatch `Build { spaceId }` and `SellBuilding { spaceId }`. Explain the four-house hotel exchange in both directions. For the final available unit, display a request that starts the shortage procedure, with no immediate charge. Until ST-610, accepted demand/offer uses the interim surface. When a hotel cannot be reduced to four houses, show the stock reason and use the interim group liquidation surface until ST-611.

**Exit fixtures.** Buy and sell an ordinary house, build and downgrade a hotel, uneven development blocked, mortgaged group blocked, final unit request with unchanged cash, and downgrade blocked with fewer than four houses. Compare accepted stock, building count and cash before and after every command.

## ST-610 · Last-building demand and single offer

**Player outcome.** An eligible player can respond to the shortage and see whether it becomes an offer or an auction.

- In `BuildingDemand`, use the accepted token, eligible seats and responses. List the current actor's legal targets for that token using the same portfolio checks as the existing demand view. Show each seat's response including unanswered and declined. Dispatch `BuildingDemand { spaceId }` for a selected target or `{ spaceId: null }` for a decline.
- In `BuildingOffer`, use `offeredSeatId` and that player's accepted target. Show fixed cost, resulting balance and building/stock change. Dispatch `BuildingOffer { accept: true }` only when affordable, or `{ accept: false }` to return the unit to stock. If multiple players register, the accepted Auction state opens ST-607.
- Lock the response after acceptance and reselect the next eligible actor through the handoff. Never infer a winner from local responses.

**Exit fixtures.** All decline, one registers then accepts, one registers then declines, unaffordable acceptance, and two registrations leading to a building auction. Reload after one response. Check the response is retained, registration charges nothing and final allocation charges once.

## ST-611 · Hotel liquidation when the bank lacks houses

**Player outcome.** A player can choose a legal distribution and see the exact group liquidation consequences before confirming.

- Open from the ST-609 holding in the applicable shortage state. Reuse the existing group membership order, hotel count, current houses, available stock, refund and resulting stock calculation from `liquidationControls()`. Display each holding with its proposed remaining houses plus the required total.
- Use one integer field per member, seeded with the existing even allocation. Validate 0–4 per member, the required total and a largest-to-smallest difference of at most one. Keep field errors visible before confirmation. Submit `LiquidateHotels { groupId, finalCounts }` in the existing board membership order, using newly validated values.
- Recompute or close the draft if ownership, levels or stock change. Display the accepted group and updated balances only after confirmation from the server.

**Exit fixtures.** Shortage with a legal even split, an invalid total, uneven distribution, non-integer input and an accepted liquidation during debt recovery. Invalid cases send zero commands. Verify accepted cash, stock and per-space count.

## ST-612 · Trade draft, review and response

**Player outcome.** Both parties see exactly what each sends and receives, and only the recipient can accept.

- Port `tradeControls()` and `tradeTerms()` into three canvas states: edit, review and accepted pending offer. Use a target seat picker and two sides with integer cash, eligible properties and retained cards. Exclude developed groups under the existing rules. Reset the target side when changing players. Use the existing server contract for validity during debt.
- Copy the reviewed terms into the review state. Show both directions, mortgage status and the recipient's potential acquisition costs. Back to edit retains the draft. A relevant change to ownership, balances or available cards invalidates review and requires reviewing the revised terms.
- Submit `OfferTrade { targetSeatId, give, receive }` with both sides shaped as `{ cash, properties, cards }`. Use the accepted pending offer for recipient review. Handoff uses the existing actor flow. Only the recipient sees enabled `AcceptTrade`. Both parties retain the existing `CancelTrade` eligibility. Route accepted acquisition through the interim UI until ST-614.

**Exit fixtures.** Cash and multiple assets/cards on both sides, edit after review, changed terms before confirmation, unauthorized accept attempt, recipient accept, each party canceling in separate runs, and refresh with an accepted pending offer. Assert transfers use the reviewed payload exactly once.

## ST-613 · Debt recovery and bankruptcy

**Player outcome.** The debtor sees the obligation, what can cover it, and what bankruptcy will transfer.

- Use `turn.pendingDebt` and authoritative actor routing. Show source, debtor, creditor or bank, amount due, cash and shortfall. `SettleDebt` is available to the debtor when cash covers the amount. Redirect to portfolio, liquidation or trade as applicable and keep the debt summary visible on return. Read the updated shortfall after each accepted recovery action.
- Match the existing bankruptcy eligibility: no buildings and available cash plus eligible mortgage proceeds still insufficient. Show cash, assets, retained cards, bank or creditor disposition and any forthcoming mortgage choices. Use a named confirmation for `Bankrupt`. Keep the accepted obligation separate from projected proceeds.
- Render whichever state the server returns after settlement or bankruptcy, including continued card effects, bank auction, pending acquisition and confirmed finish. Existing interim screens cover acquisition and victory until their canvas stories.

**Exit fixtures.** Affordable settlement, sale/mortgage making debt payable, trade during debt, blocked bankruptcy with recoverable value, bank and creditor bankruptcies, and an accepted payment retried after a lost response. Assert the correct seats, obligation and destination of money or property after each transition.

## ST-614 · Acquire mortgaged property

**Player outcome.** The recipient can decide what to do with each mortgaged holding and see the exact immediate charge.

- Project `turn.acquisition.seatId` and `spaceId` as the actor and subject. Use the same principal, interest and release helpers as the portfolio. For each choice, show immediate cost, cash after payment or shortfall, and rent eligibility after payment. Send `ChooseMortgage { choice: 'keep' }` or `{ choice: 'release' }`.
- Preserve both legal choices even when the player has insufficient cash. The server can transition into debt. Re-render after acceptance for the next holding, debt or finish. Preserve prior property decisions after refresh and keep winner presentation behind accepted `Finished`.

**Exit fixtures.** Keep and release in separate runs, sequential acquisitions, insufficient funds leading to debt, and final bankruptcy whose winner appears only after acquisitions. Refresh mid-queue and retry a lost accepted response. Verify one charge per property and the accepted final state.

## ST-615 · Accepted turn history with acting-seat attribution

**Player outcome.** A player can reconstruct a turn, including a different player's bid, payment or offer response.

- Consume the public boundaries and decision facts from ST-616 together with ST-603 movement events. Render them through the same turn-detail text projection on all layouts. Use the boundary event's revision and index as the group key and each event's revision and index as its row key. Do not deduplicate on human-readable text.
- Derive the current-turn panel and prior-turn sections from accepted history. Process revision then event index, and anchor groups to explicit turn boundaries. Extra rolls stay in the same group. Attribute a bid or trade response to its actor while leaving it under the originating turn. Concurrently visible actor and turn-owner labels must agree with the current accepted decision.
- Handle existing saved rows with missing boundaries or actors as readable chronological history using available facts. Keep partial history readable even when the current client's bounded window starts mid-turn. Opening the panel never changes the selected actor, command draft or pending state. On close restore focus to the opener unless it has been replaced by a newer decision.

**Exit fixtures.** AC-46 decline → different actor bids/pass → settlement → next turn. Add extra roll, bankruptcy advancing the active seat, duplicate delivery, refresh, and a mixed old/new save with a partial history window. Assert one entry per accepted fact, correct ordering and attribution, preserved pending decision, and no private fields in the history response.

## ST-616 · Publish the public facts needed for turn history

**Player outcome.** Refresh and retry preserve enough public evidence to explain which accepted actions happened in each turn.

- Extend the authored reducer's public events additively. Emit a turn-change fact with previous and next active seat IDs when the turn becomes playable for a new seat. Use the initial `MatchStarted` plus the first active seat where available, and account for delayed advancement through bankruptcy acquisitions. Extra rolls and temporary changes of decision actor do not advance the turn.
- Emit a purchase-decline fact with the actor and space before the resulting auction begins. When existing events lack a required decision actor, add the actor to that event or emit a minimal public decision fact. In particular, distinguish the actor accepting a trade from its proposer, and attribute the accepted last-building response and acquisition choice to the seat committing it. Reuse existing event facts for rolls, bids, payments and movement. Keep each semantic decision represented once in the projection.
- Persist new events with the existing ordered revision rows in [rooms/service.js](../../src/rooms/service.js:54). Keep legacy rows readable without backfilling or replaying commands. The sync payload exposes public seat/space IDs and accepted decision facts only. Keep raw command payloads, credentials, hidden deck data and private queues out of the event additions. A rejected or duplicate command appends no new facts.

**Exit fixtures.** Inspect production HTTP history for decline followed by auction open, ordinary turn change, extra roll, bankruptcy with pending acquisition and a trade accepted by its target. Reopen persisted history and retry the same command ID. Check event order, actor/subject accuracy, unchanged retry counts, and redaction. Hand off an example revision row for each new event to ST-615.
