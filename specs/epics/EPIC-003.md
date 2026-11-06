# EPIC-003 · Private full-match play across devices

**Status:** Deferred proposal. [EPIC-002 local presentation](EPIC-002.md) has priority. This plan does not authorize implementation, remote hosting or a rules change.

## Outcome

Two to four family members can join an invite-only room from separate browsers and play the authored `vn-original-v1` match through a server-recorded winner. Each device controls only its authenticated seat. Pending decisions and accepted outcomes survive refresh and retry. Reuse the game-centered presentation proven in EPIC-002 where practical.

Today the authored engine is available through the room service and the shared-browser page, while private-room HTTP routes and their UI use the synthetic profile. The local page stores every seat credential and offers a seat chooser; that shared-device boundary must not be carried into a private room.

## Proposed slices

These are planning labels, not assigned backlog IDs. Select and approve one slice at a time; preserve existing requirement and scenario IDs.

| Slice | Story | Acceptance evidence |
| --- | --- | --- |
| S1 · Profile and room routing | As a host, I can start a private room with the authored profile. | Select the profile explicitly and validate it on the server; freeze board and rules versions at start. Two to four ready, connected seats receive reproducible setup rolls. Existing synthetic rooms and local games resume with their pins. Reject unknown versions and concurrent stale start/join requests without a partial match. Store private deck order and snapshot content for replay. |
| S2 · Shared board and turns | As a player, I can see the same board and use my own roll, purchase and end-turn controls. | Independent sessions see the same committed revision, active seat, balances, positions and ownership. Only the authenticated actor can roll, buy or end; others see waiting status. Board copy matches the pinned profile. Verify desktop keyboard, 360px touch, reduced motion and the accessible space list, preserving the synthetic meaning of AC-01–04, AC-06 and AC-10. |
| S3 · Auctions | As an eligible bidder, I can bid or pass from my own device. | Current price, eligibility and outcomes agree across browsers. Cover the 10 xu opening, affordability, committed ordering, final passes, leader restriction, all-pass and exactly one settlement. Race bids at the same revision; a stale bid resyncs rather than silently overwriting another. Trace AC-05, AC-12–13 and AC-35. |
| S4 · Full-match decisions | As a player, I can respond to cards, jail, debts, trades, mortgages, development and building shortages. | Each pending decision identifies its responsible seat; unauthorized commands leave state and revision unchanged. Show prices and consequences before commitment, then display only server-accepted results. Cover AC-11, AC-14–15, AC-17–32 and AC-37 for relevant private-room paths; hide deck order and internal continuation work. |
| S5 · Reconnect and retries | As a returning player, I can recover my seat and decision after refresh or a lost response. | Retain only the caller's session and original pending command. Identical retries return their original receipt; altered reuse fails. Detect stale revisions and event gaps and resync before accepting a new intent. Exercise auction, card collection, debt, mortgage acquisition, trade and building demand across reconnect and configured-store restart. Verify one ledger effect and authorized projection. Trace AC-07–09, AC-14, AC-16, AC-21 and AC-27. |
| S6 · Multi-device acceptance | As a family, we can finish the representative game path and see the same winner. | Reproducible runs use 2 and 4 isolated browser contexts, server-scripted randomness and revision/event evidence for purchase, auction, rent, card, trade, debt/bankruptcy, reconnect and winner. Exercise unauthorized actor, duplicate command and event-gap cases; retain B-06 and B-10 regression runs. Record emulation separately from physical-device and human review. |

## Architecture and boundaries

- The current room service binds its reducer/profile at construction; the web adapter wires private rooms to the synthetic service. S1 must document and test a versioned dispatch mechanism for persisted rooms, including after restart. Client-provided actor IDs and profile values never establish authority.
- Return only the caller's seat session, public state and permitted own details. An invite alone must not expose room state. Never send other seat sessions, deck permutations, private randomness or continuation queues. Public retained release-card identities follow DP-07.
- Treat visuals as a projection of accepted server events. Each browser reconciles on gaps, duplicates, refresh and reconnect; animation never applies payments or game rules.
- Keep the current single-process file store as the initial internal boundary. Multi-process storage, internet hosting, recovery across devices, retention and abandonment changes belong to separately selected work. No account, chat, bot, public listing or payment feature is included.
- Update requirements, scenarios and source evidence before any approved rules or digital-policy change. B-09's wider-playtest checks remain open until real reviewers record their results.

## Epic acceptance

All approved slices pass their evidence; a private match reaches the same server-recorded winner from isolated contexts; authorization, version pins, replay, receipts, reconnect and redaction are verified; shared-screen local play and existing synthetic rooms retain their regression coverage. This is an internal milestone, with wider or remotely hosted play considered separately under [EPIC-004](EPIC-004.md).
