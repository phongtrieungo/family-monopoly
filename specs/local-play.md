# B-10 · Shared-browser local play

The owner requested one machine for four people after B-08. This slice adds a shared-browser session for 2–4 people using `vn-original-v1` and `vn-neighborhood-v1`. It precedes B-09's wider-playtest review. Private online rooms and the synthetic browser prototype remain available.

## Behavior and authority

A local setup accepts 2–4 distinct display names and starts the authored match without invites or readiness steps. Creation is atomic and retryable with an opaque client-generated creation ID. The response returns each seat's separate session credential once to the shared browser. Identical creation retries recover the same seats; changed names under that ID are rejected. The browser stores those credentials in session storage for reload recovery. All people sharing the browser can control its seats; this mode provides no identity boundary between people at the same machine. ST-202 presents setup before the board, then projects the authoritative snapshot through Phaser; the complete 40-space names, occupants and owners remain in the separate native HTML list.

The server still derives an actor from the selected seat credential and validates revisions and receipts. The local browser never computes accepted dice, moves, prices, rent, ownership or settlement. One connection lease represents the shared device: loss or recovery updates all its seats together without changing pending decisions. Local sync and command routes require a local-mode session. Public snapshots and event history hide credentials, deck order and internal continuation work.

The screen identifies the required actor for turns, debts, mortgage acquisitions and building offers. An explicit handoff confirmation precedes controls when the acting person changes, including after reload. Auctions and building demand have a visible person chooser; passing never changes who owns the underlying turn. A separate person chooser permits lawful off-turn asset management and trade confirmation. The server remains the final legality guard.

Show a readable 40-space board and space list, player cash and jail status, properties and buildings, bank stock, pending obligations, retained cards, events and the winner. Expose all B-08 command decisions with consequence text before commitments. Original content stays marked as an internal draft pending language, balance and distribution review.

## Recovery

Refresh restores the same match and seat bundle and requires handoff acknowledgement again. A lost command response retains the command ID, payload, actor and original expected revision. An explicit retry submits that exact command. A stale revision requires resync and a new intent. Failed sync keeps the last state visible and disables game controls. Starting a new local match requires confirmation if the current one is unfinished. Server retention and abandoned-match cleanup stay B-09 review decisions.

## Acceptance

AC-33–38 are specified in [local-play.feature](features/local-play.feature). Verify API authorization, atomic setup, creation and command retries, redaction and refresh recovery. Browser acceptance uses four seats on one page at desktop width and repeats essential controls at 360 CSS pixels with touch, keyboard and reduced motion. Include purchase, an auction with explicit bidders, debt recovery, full-match decision controls and winner display. No physical-device or wider-playtest approval is implied by emulation.

## Browser acceptance runner and evidence

Run with Bun 1.4.4 and a local Chrome/Chromium executable:

```sh
CHROME_BIN=/path/to/chromium bun scripts/local-play-acceptance.js
```

On 2026-11-06, the runner passed AC-33–38 with four seats on one 1440px browser page, keyboard handoff, and a separate 360px touch context with reduced motion. It exercised real setup, purchase refresh, an accepted purchase with its response lost and retried, explicit auction actors and rent. Saved decision fixtures then exercised jail fee and retained release, debt liquidation and payment, acquired mortgage choice, confirmed trade, construction and sale, final-house demand and auction, shortage hotel liquidation, and final bankruptcy/winner display through the same production HTTP/UI path. The phone context checked setup, handoff, purchase, the 40-space list, 44px controls, no horizontal overflow and failed-sync recovery.

ST-202 owner manual validation: on 2026-11-06, the owner confirmed that the app runs correctly in their environment and directed that the automated browser handoff check be bypassed for story closure. The current acceptance runner still times out waiting for controls after its synthetic handoff input. This is not recorded as an automated browser pass; the owner’s manual validation is the closure evidence for ST-202.

The Bun suite passes 68 tests on Bun 1.4.4. The existing two-browser synthetic prototype acceptance also passes after this slice. The local API suite checks 2–4 player setup, failed-commit atomicity, opaque creation retries, session-derived actors, stale revisions, nonlocal-session rejection, command retries across storage reopening, redaction and shared connection state. These are internal automated checks. Fluent-reader review, balance, physical-device coverage and wider playtest/distribution review remain open under B-09.
