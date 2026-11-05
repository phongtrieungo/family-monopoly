# GAME-SPEC-001 · Product requirements and game design

The planning baseline selects an original Vietnam board theme, modern art direction, desktop and mobile targets, Hasbro Classic C1009 rules and private rooms. The owner selected C1009 with original Vietnamese presentation and translated UI on 2026-11-06. See the [edition review](research/edition-review.md) for the exact document and open content gates. The details below define the first prototype. Proposed digital policies are recorded separately from edition rules.

## Product and game design

Families use an invite to gather around a shared board from their own devices. A match is a turn-based property trading game: move around the board, buy or auction unowned properties, collect rent, trade and develop holdings, resolve debts, and finish when one player remains solvent. A server-controlled bank and explicit action prompts remove bookkeeping. The [rules registry](rules.md) governs every rule claim. The Vietnam theme is a project-authored setting with original presentation.

The first playable slice proves a two-device session from invite through purchase or auction, rent and the next turn, including refresh during a pending decision. Full-match completion is a later milestone. Prototype scope is 2–4 guests, one board, Vietnamese-first copy, browser-based mouse, keyboard and touch input, and a seeded synthetic fixture for internal testing. Exclude accounts, matchmaking, chat, bots, public listings, payments and alternate rule modes.

## User stories

| ID | As a… I want… | Acceptance |
| --- | --- | --- |
| US-01 | Host, I want to create an invite-only lobby so I can gather my family | Share an opaque invite, see seats and readiness, and start only with two or more ready connected seats. |
| US-02 | Guest, I want to join from my phone with a nickname | A valid invite opens the lobby and gives one seat. Full, closed and invalid rooms show recoverable errors. |
| US-03 | Active player, I want to see and use my legal actions | The board shows my roll and landing. Buying and declining lead to different server-validated outcomes. |
| US-04 | Bidder, I want a fair auction | Eligible seats get the same current price. The highest accepted bid settles once and everyone sees the outcome. |
| US-05 | Returning player, I want to recover my seat after refresh | The original seat, pending decision and current revision reappear without duplicate actions. |
| US-06 | Player using keyboard, touch or reduced motion, I want to follow the board | Each space has a readable equivalent in the space list and turn announcements work without animation. |
| US-07 | Player in debt, I want to see what I owe and what I can do | Later full-match work covers lawful liquidation, settlement, bankruptcy and winner display. |

## Prototype acceptance

Run host and guest in separate browser contexts at desktop and phone widths. Join via invite, ready both seats, play through purchase and auction fixtures, pay rent, and resume a pending decision after a refresh. Record revision and event evidence for a duplicate submission and an unauthorized command. Pass the UI criteria with keyboard and touch. Use internal branding and synthetic values, labeled in the UI as a prototype.

## Design index

- [Rules verification registry](rules.md)
- [Vietnam board and theme](board-theme.md)
- [Turn state machine](turn-state.md)
- [Private multiplayer rooms](rooms.md)
- [UI and accessibility](ui-ux.md)
- [Feature requirements and Gherkin](features/README.md)
- [Architecture decisions](adr/README.md)
- [Implementation backlog and test strategy](backlog.md)
- [Research and source manifest](research/sources.md)
- [Licensing and asset manifest](research/licensing.md)
