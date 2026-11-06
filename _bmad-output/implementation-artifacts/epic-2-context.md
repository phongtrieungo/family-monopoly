# Epic 2 Context: A delightful family game on one shared screen

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Make the authored 2–4 player `vn-original-v1` match inviting and understandable on one shared browser, from setup through winner, while preserving the server's game rules and command authority. The board, active player, balances, ownership, current decision, and its consequence should be clear without an administration-style dashboard. The configured planning-artifacts directory is empty; this context is grounded in the Epic 2 plan and story knowledge base.

## Stories

- Story ST-201: Visual direction and renderer spike
- Story ST-202: Game table and setup
- Story ST-203: Turn and landing
- Story ST-204: Cards, payments and auctions
- Story ST-205: Manage, trade and recover
- Story ST-206: Finish and family acceptance

## Requirements & Constraints

- Continue one approved backlog slice at a time. ST-204 is selected as B-14; later slices remain proposed until selected. Preserve existing requirement, rule, digital-policy, and scenario IDs.
- The server owns actor, revision, dice, legal outcomes, transactions, receipts, and recovery. The presentation renders accepted snapshots and events, submits authorized intents, and never determines a game result or applies a payment.
- Preserve the authored profile, pinned match data, seat handoffs, hidden deck order, reconnect behavior, idempotent retries, and existing decisions. Do not change tabletop rules, digital policies, reducer behavior, or profile data in a presentation slice; approved behavior changes require matching spec and scenario updates.
- Use original or cleared artwork, copy, type, icons, effects, and audio. Record provenance before importing or distributing assets. Do not reproduce commercial game imagery or card text.
- Treat the B-09 fluent-reader, branding, family, accessibility, balance, retention, physical-device, and distribution reviews as open unless recorded evidence closes them.

## Technical Decisions

- Use Phaser for the board scene and native HTML for controls, text, the equivalent space list, and announcements. Keep essential information and actions available if Canvas/WebGL effects are unavailable.
- Render only committed server snapshots and events. Reconcile on refresh, reconnect, duplicate events, or event gaps; optional animation can be skipped and must never gate or settle a command.
- Keep the Bun/ES-module client local-bundled with pinned dependencies; do not depend on a CDN. Preserve the existing authorized command and session boundaries.

## UX & Interaction Patterns

- Keep the board central. Pair the active player and current action with balances, ownership, and relevant price or consequence before commitment. Guide players one decision at a time and keep the local game playable throughout each slice.
- Use short Vietnamese-first copy and pair color with text or symbols. Provide readable text for board spaces and events, accessible names, visible focus, and turn/outcome announcements.
- Support keyboard and touch at 360 CSS pixels and desktop widths, with primary targets at least 44 CSS pixels. Respect reduced motion and provide a skip or disable path; no decision should require animation. Restore focus after dialogs or action changes.
- Require an explicit handoff before another local seat acts. Keep the responsible person and legal choices visible; show waiting state to other seats.

## Cross-Story Dependencies

- Sequence is ST-201 → ST-202 → ST-203 → ST-204 → ST-205 → ST-206. ST-201 records the accepted renderer choice; each later story depends on the previous local presentation slice.
- EPIC-002 builds on the authored full-match engine and shared-browser local play. Separate-device private rooms in EPIC-003 follow proof of the local presentation; wider-playtest and hosting decisions in EPIC-004 remain deferred.
