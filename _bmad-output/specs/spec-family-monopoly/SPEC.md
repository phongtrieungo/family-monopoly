---
id: SPEC-family-monopoly
companions:
  - ../../planning-artifacts/architecture/architecture-family-monopoly-2026-11-07/ARCHITECTURE-SPINE.md
  - ../../../specs/GAME-SPEC-001.md
  - ../../../specs/rooms.md
  - ../../../specs/local-play.md
  - ../../../specs/full-match-implementation.md
  - ../../../specs/features/README.md
  - ../../../specs/epics/EPIC-003.md
  - ../../../specs/epics/EPIC-004.md
  - ../../../specs/playtest-review.md
sources: []
---

# Family Monopoly

## Why

Families need an understandable Vietnamese-first property-trading game they can play together on one device or privately from separate devices. The current local full match and synthetic private-room prototype establish a base; the future private pilot must support the authored full match and recover players after interruptions and device changes.

## Capabilities

- **CAP-1**
  - **intent:** Families set up and play a shared-browser match with distinct seats.
  - **success:** Two to four named players start the authored match, acknowledge handoffs and resume a pending decision after refresh (US-08, AC-33–38).
- **CAP-2**
  - **intent:** Family members join a private room from separate devices and play the authored full match.
  - **success:** Two to four authenticated seats see consistent accepted state and the same server-recorded winner; each device controls only its own seat (US-01–05, EPIC-003).
- **CAP-3**
  - **intent:** Players understand and act on turns, property decisions, auctions, cards, trades, debt and the final outcome.
  - **success:** Legal decisions and consequences remain readable and operable with keyboard, touch and reduced motion; accepted outcomes match the server (US-03, US-04, US-06, US-07; AC-04–06, AC-11–32, AC-37–38).
- **CAP-4**
  - **intent:** Players return to their committed match and pending decisions after refresh, lost responses or server restart.
  - **success:** Authorized reconnect restores the latest revision; an identical retry returns its original result without a second effect; stale or unauthorized commands leave state unchanged (US-05, AC-07–09, AC-36; AD-1–3, AD-6).
- **CAP-5**
  - **intent:** A player who loses their browser session or changes device can reclaim their own seat with a private recovery code.
  - **success:** A valid code restores only its seat and committed pending context, issues a new session and invalidates the prior session; an invite alone or the host cannot reset a seat. If both session and code are lost, the family starts a new match (AD-6). This is a future requirement, not an implemented capability.

## Constraints

- The server owns game outcomes, authenticated actors, revisions and settlement. Deterministic inputs, profile pins, atomic receipts and event records preserve replay and idempotency (AD-1–3).
- Private views and event history exclude other seats' credentials, unrevealed decks and internal continuation state. Shared-browser mode is a trusted shared device, with separate sessions and explicit handoffs (AD-3–4).
- Maintain accessible native equivalents, keyboard and touch access, reduced motion and server-derived presentation; local board rendering follows AD-5.
- Preserve existing US, R, DP and AC identifiers. Rule or digital-policy changes require approved specifications and scenarios; use original or individually cleared content with provenance.
- The future remote pilot targets at most four people and permits brief maintenance pauses. Committed match, pending decisions, seat authentication and receipts survive restart (AD-6).
- Existing ADR-003 and EPIC-003 defer cross-device seat recovery; CAP-5 records the owner's later decision. Reconcile those upstream documents and scenarios before implementing it.

## Non-goals

- Accounts, matchmaking, public listings, chat, bots, payments and alternate rule modes.
- Deployment, invitations to a wider audience or changes to game rules by virtue of this spec alone.
- Host-assisted seat reset or seat recovery using only a room invite.

## Success signal

Two and four isolated browser contexts complete reproducible authored-match journeys through purchase, auction, card, debt, trade, reconnect and the same winner. Separate recovery tests demonstrate restart persistence, seat reclaim and session invalidation without duplicate effects; real family and device evidence is recorded separately from emulation.

## Open Questions

- How are recovery codes issued, delivered, protected and rotated, and how does recovery safely handle a lost response?
- Which hosting, durable store, backups, retention, abandonment and operational policies will be approved for the remote pilot?
- Who will conduct and record the family, fluent-reader, accessibility, physical-device, branding and distribution reviews required by B-09?
