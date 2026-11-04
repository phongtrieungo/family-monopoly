# Turn state machine

The server applies one accepted command at a time per room. Automatic effects settle in the same transaction until the next decision boundary. Persist active seat, phase, position, consecutive doubles where applicable, pending obligation or auction, balances, ownership and room revision.

| Phase | Trigger and guard | Result |
| --- | --- | --- |
| AwaitRoll | Active seat submits Roll | Record authoritative dice and resolve movement and landing. |
| ResolveLanding | Internal only | Dispatch in order to purchase decision, rent/debt, card or other space effect, then AwaitEnd or a permitted extra roll. |
| AwaitPurchase | Active seat buys with sufficient funds | Transfer funds and deed together, then settle the turn. |
| AwaitPurchase | Active seat declines | Start Auction for the landed property with every seat in the synthetic match eligible, including the declining seat. |
| Auction | Eligible seat submits a valid bid or passes | Accept strictly higher affordable bids. Passing is final. When only the high bidder remains eligible, settle once. If everyone passes without a bid, return the property to the bank. |
| AwaitDebt | Debtor submits permitted settlement or liquidation | Resume the saved continuation when paid. If bankrupt, resolve creditor transfers and remove the seat from turn order. |
| AwaitEnd | Active seat ends after effects settle | Advance to next eligible seat and AwaitRoll. |
| Finished | Bankruptcy leaves one solvent player | Publish winner and reject further game commands. |

The first slice uses one roll per turn in synthetic fixtures and affordable rent only. Later profiles add doubles, jail, cards, debt and victory. Their precise transitions depend on R-02 and R-05 through R-09. A continuation records the effect source and remaining work so a payment or card cannot be applied twice. Jail arrival and an ordinary visit must be distinct state. Bid ordering follows committed revision order, and an accepted high bidder cannot pass while leading. No unrelated spending is available during an auction.

Invariants: one active turn, at most one pending decision, each property has one owner or belongs to the bank, player cash never becomes negative, and one accepted payment or settlement generates one ledger entry. Rejected commands leave game state unchanged.

## B-02 reducer boundary

The synthetic reducer accepts committed turn state, an actor and a command. The authoritative roll is a separate input supplied by the caller. The reducer returns the next state and events together, including one ledger event per purchase or rent transfer. A rejected command throws before returning any state or events. Room revision checks, atomic persistence and command deduplication belong to the room layer.

B-02 supports Roll, Buy and EndTurn. An unaffordable rent landing is outside the supported fixture range and is rejected without committing the roll. Moving past start wraps the position without a cash award in this synthetic profile.

## B-03 auction boundary

The synthetic profile has no eliminated seats. A seat with zero cash can pass. A bid must be a positive safe integer, exceed the current high bid and be affordable from the bidder's current cash. The auction starts without a high bid. Only the active seat can decline. Once the auction starts, any eligible seat can bid or pass, subject to the leading bidder restriction.

Bids leave balances and ownership untouched until settlement. The winner pays the accepted bid to the bank, receives the deed and produces one settlement ledger event. Both a sale and an all-pass outcome clear the auction and leave the original active seat in AwaitEnd. These auction choices are provisional for the prototype pending R-03 verification.
