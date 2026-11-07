# B-10 · Shared-browser local play

The owner requested one machine for four people after B-08. This slice adds a shared-browser session for 2–4 people using `vn-original-v1` and `vn-neighborhood-v1`. It precedes B-09's wider-playtest review. Private online rooms and the synthetic browser prototype remain available.

## Behavior and authority

A local setup accepts 2–4 distinct display names and starts the authored match without invites or readiness steps. Creation is atomic and retryable with an opaque client-generated creation ID. The response returns each seat's separate session credential once to the shared browser. Identical creation retries recover the same seats; changed names under that ID are rejected. The browser stores those credentials in session storage for reload recovery. All people sharing the browser can control its seats; this mode provides no identity boundary between people at the same machine. ST-202 presents setup before the board, then projects the authoritative snapshot through Phaser; the complete 40-space names, occupants and owners remain in the separate native HTML list.

The server still derives an actor from the selected seat credential and validates revisions and receipts. The local browser never computes accepted dice, moves, prices, rent, ownership or settlement. One connection lease represents the shared device: loss or recovery updates all its seats together without changing pending decisions. Local sync and command routes require a local-mode session. Public snapshots and event history hide credentials, deck order and internal continuation work.

The screen identifies the required actor for turns, debts, mortgage acquisitions and building offers. An explicit handoff confirmation precedes controls when the acting person changes, including after reload. Auctions and building demand have a visible person chooser; passing never changes who owns the underlying turn. A separate person chooser permits lawful off-turn asset management and trade confirmation. The server remains the final legality guard.

Show a readable 40-space board and space list, player cash and jail status, properties and buildings, bank stock, pending obligations, retained cards, events and the winner. Only server `Finished` with its recorded winner opens the finish summary, after all mandatory acquisition choices. Thank all players and list final cash, properties (including mortgages/buildings) and bankruptcy status in seat order without rankings or invented statistics. Finished HTML and Phaser show no active-turn labels or gameplay controls. Focus the finish heading on entry, keep periodic sync from stealing focus, and make celebration opt-in with Skip/Stop and a static reduced-motion equivalent. Refresh restores the result without replaying celebration. Expose all B-08 command decisions with consequence text before commitments. Original content stays marked as an internal draft pending language, balance and distribution review.

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


## ST-206 / B-16 finish acceptance · 2026-11-07

`CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun scripts/local-play-acceptance.js --st-206` passed on Bun 1.4.4 and Chrome 156.0.8078.81. The matrix covers 2 and 4 seats, each at 1440×800 with keyboard and normal motion and 360×800 with native CDP touch gestures and reduced motion. Primary setup and actions use the stated input; the supplementary fresh-match setup for confirmed unfinished replacement uses keyboard submission, explicitly reported as `replacementSetupInput`. Touch targets are scrolled into view and checked for obstruction; DevTools requests have a bounded timeout. Saved checkpoints in a temporary file store exercise turn/purchase, explicit auction bidders, a revealed card, debt payment, trade, disconnect/recovery and final bankruptcy through production HTTP/UI paths. These are representative scripted journeys, **not uninterrupted naturally played matches**.

| Evidence | 2 seats, both widths | 4 seats, both widths |
| --- | --- | --- |
| Unauthorized / stale roll | HTTP 400 / 409 at revision 1; accepted snapshot unchanged | HTTP 400 / 409 at revision 1; accepted snapshot unchanged |
| Lost Buy response and identical retry | Revision 3; exactly one PropertyBought event | Revision 3; exactly one PropertyBought event |
| Final bankruptcy with mortgaged holding | AwaitAcquisition at revision 16; no winner; stale choice preserves decision | AwaitAcquisition at revision 18; no winner; stale choice preserves decision |
| Acquisition resolved | Finished at revision 17; one SeatBankrupted and one MatchFinished | Finished at revision 19; one SeatBankrupted and one MatchFinished |

Every final summary matches accepted per-seat cash and bankruptcy status and shows the final mortgaged holding; HTML, Phaser and focus name the recorded winner, with no active-turn labels or gameplay controls. Two-seat journeys opt into celebration and stop it; four-seat journeys skip it. Reduced motion uses a static treatment. Refresh retains the same summary without autoplay; periodic sync preserves user focus. Canceling unfinished replacement retains the local session; finished replacement and confirmed unfinished replacement return to setup while preserving the server's match records. The HTTP test also verifies final acquisition charges once, exact retry preserves its receipt, and a terminal Roll is rejected without changing state, revision, history or receipts. Existing domain AC-23 coverage remains unchanged.

Captures: `/tmp/family-monopoly-st206-2-desktop.png`, `/tmp/family-monopoly-st206-2-phone.png`, `/tmp/family-monopoly-st206-4-desktop.png`, `/tmp/family-monopoly-st206-4-phone.png`. Desktop and phone captures were inspected for readable summary, consistent winner, wrapping and controls. The full AC-33–38 runner, synthetic private-room browser runner, 69 Bun tests and web build pass. These artifacts are temporary local captures, not participant evidence.

**Family gate remains open under B-09.** No real participants have provided age range, player count, device, observed confusion or outcomes; no family, physical-device, screen-reader, fluent-reader, branding, balance, retention-policy or distribution approval is claimed. Runtime hook model/token output was not supplied in this session; model and token evidence are unavailable.
