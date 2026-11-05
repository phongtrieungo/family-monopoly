# B-06 prototype acceptance

Run the acceptance check with Bun 1.4.4 and a local Chromium or Chrome executable.

```sh
CHROME_BIN=/path/to/chromium bun scripts/prototype-acceptance.js
```

The runner starts the existing HTTP adapter on loopback with a temporary room store and an isolated browser profile. It uses the shared synthetic board and injects three server rolls in order, `[1, 1]`, `[1, 1]`, and `[2, 3]`. Each seat starts with 100 xu. The default local server continues to use random dice.

## Evidence

Passed on 2026-11-05 against the merged B-05 prototype using two isolated Chrome contexts at 1280 px with keyboard and 360 px with touch emulation. The guest joined through the host's invite, both seats readied, and the host started the match. Both contexts identified the destination in the space list with reduced motion enabled. The host reached and activated Buy with the keyboard. The guest used touch for rent and auction actions. The auction action stayed visible and disabled during a simulated disconnect, resumed after sync, and announced settlement.

| Check | Revision | Observed result |
| --- | --- | --- |
| Unauthorized guest roll | 4 | HTTP 400. Snapshot and event history stayed identical. |
| Refresh during purchase | 5 | Same seat and snapshot in `AwaitPurchase`. |
| Buy and retry the original command | 6 | One `PropertyBought` for 50 xu. The retry returned the original receipt with zero new events and no extra charge. |
| Rent | 8 | One `RentPaid` for 5 xu. Balances became 55 and 95 xu. |
| Auction | 13 | One `AuctionSettled` for 30 xu. The guest received the deed and balances became 55 and 65 xu. |
| Next turn | 14 | The guest could roll. |

See [prototype acceptance](GAME-SPEC-001.md#prototype-acceptance) and [AC-10](features/interface.feature). This run uses emulated phone input on the same host. Physical device and wider playtest coverage remain separate from this internal acceptance run. The edition and content gates in [B-07](backlog.md) remain open.
