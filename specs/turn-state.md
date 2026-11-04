# Turn state machine

The server applies one accepted command at a time per room. Automatic effects settle in the same transaction until the next decision boundary. Persist active seat, phase, position, consecutive doubles where applicable, pending obligation or auction, balances, ownership and room revision.

| Phase | Trigger and guard | Result |
| --- | --- | --- |
| AwaitRoll | Active seat submits Roll | Record authoritative dice and resolve movement and landing. |
| ResolveLanding | Internal only | Dispatch in order to purchase decision, rent/debt, card or other space effect, then AwaitEnd or a permitted extra roll. |
| AwaitPurchase | Active seat buys with sufficient funds | Transfer funds and deed together, then settle the turn. |
| AwaitPurchase | Active seat declines | Start Auction with eligible solvent seats, including the declining seat under the prototype policy. |
| Auction | Eligible seat submits a valid bid or passes | Accept strictly higher affordable bids. Passing is final. When only the high bidder remains eligible, settle once. If everyone passes without a bid, return the property to the bank. |
| AwaitDebt | Debtor submits permitted settlement or liquidation | Resume the saved continuation when paid. If bankrupt, resolve creditor transfers and remove the seat from turn order. |
| AwaitEnd | Active seat ends after effects settle | Advance to next eligible seat and AwaitRoll. |
| Finished | Bankruptcy leaves one solvent player | Publish winner and reject further game commands. |

The first slice uses one roll per turn in synthetic fixtures and affordable rent only. Later profiles add doubles, jail, cards, debt and victory. Their precise transitions depend on R-02 and R-05 through R-09. A continuation records the effect source and remaining work so a payment or card cannot be applied twice. Jail arrival and an ordinary visit must be distinct state. Bid ordering follows committed revision order, and an accepted high bidder cannot pass while leading. No unrelated spending is available during an auction.

Invariants: one active turn, at most one pending decision, each property has one owner or belongs to the bank, player cash never becomes negative, and one accepted payment or settlement generates one ledger entry. Rejected commands leave game state unchanged.
