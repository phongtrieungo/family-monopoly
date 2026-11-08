# Epic 5 Context: One living neighborhood table

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Present the authored 2–4-player shared-browser match as a cohesive illustrated 2.5D Vietnamese neighborhood table, connecting the board, player summaries and contextual decisions while preserving full-match play throughout migration. The primary experience is shared desktop and tablet play, with a usable 360px phone layout. The planning-artifacts directory contains an architecture spine but no standalone PRD, product brief or UX/design documents; the epic supplies the approved visual direction, and ST-501 has established the detailed visual contract. Owner UI approval was recorded on 2026-11-08; see specs/design/game-ui/DESIGN.md and EXPERIENCE.md.

## Stories

- Story ST-501: Visual contract and mockup approval
- Story ST-502: Playable table and core turn
- Story ST-503: Cards, auctions and transaction feedback
- Story ST-504: Portfolio, trade and recovery
- Story ST-505: Finish and complete-game acceptance

## Requirements & Constraints

- Implement one authorized slice at a time. ST-501 is complete with owner UI approval on 2026-11-08; approval of the overall sequence does not authorize later implementation without its own approved contract. Future stories require their own approved implementation contracts.
- Keep the complete authored local match playable during migration. Preserve existing commands, saved sessions and acceptance contracts AC-04, AC-06, AC-11–32 and AC-33–38. This epic authorizes presentation changes, without changes to rules, economy, profiles, hosting or distribution.
- Use original or cleared visual and audio content and record provenance and review in the research manifests. Wider family, language, branding, accessibility and distribution reviews remain human acceptance gates.
- Make high-fidelity table, purchase and auction mockups available for approval before playable-UI implementation. Setup, trade/debt, victory, tablet and phone layouts also need reviewable presentations. ST-501 demonstrations must identify their fixtures explicitly and must not imply a connected or rules-complete game.
- At desktop and landscape-tablet widths, show the board, player summaries and primary decision without normal page scrolling. At portrait and 360px widths, retain the overview above an internally scrolling decision sheet, without horizontal overflow or forced rotation.
- Record comparisons to approved mockups, browser captures and motion evidence in implementation slices, together with authoritative revision, retry and reconnect verification.

## Technical Decisions

- Retain Bun, Phaser 3.90.0 and native HTML under ADR-007, including Canvas fallback. The architecture separates presentation from room authority and deterministic domain decisions.
- The server supplies randomness and determines outcomes; rendering and effects derive from committed snapshots and events. Neither animation nor sound may generate commands or determine settlement. Persist accepted outcomes and pinned board/rules versions, and reject unsupported versions without altering matches.
- Authenticate actors using seat sessions and serialize room writes. Commit state, revision, command receipt and revisioned events atomically. An identical retry returns its original receipt before revision checking; reuse of an identifier with a changed payload is rejected.
- Local play uses separate seat sessions in the trusted shared browser, explicit handoffs and a shared connection lease. Distinguish the acting seat from the turn owner in presentation while retaining server authorization as final authority.
- Apply authorization and redaction to snapshots and history. Discard duplicate events, fetch an authorized snapshot on gaps or reconnect, and resynchronize before submitting a new intent. Do not expose other seats’ credentials, undealt deck order, random state or internal queues.
- Keep native HTML equivalents for spaces, actions and announcements. Preserve keyboard, touch, text zoom, readable controls and reduced motion. Localized UI copy remains separate from pinned rules and board content.

## UX & Interaction Patterns

- Use a fixed shallow oblique board with dimensional pieces, original Vietnamese shopfronts, trees and tactile materials. Provide bounded overview/focus framing; full 3D rendering and free rotation are outside the approved direction.
- Connect player HUDs to the table and distinguish the turn owner from the person holding the device. A single action dock identifies the actor, consequence and amount. Use coordinated temporary overlays for inspection, auctions, portfolios, trades and debt.
- Present short, lively dice, movement and payment feedback with Skip and reduced-motion support. Optional original sound effects require deliberate enablement and persistent mute; no music is planned.
- Keep setup and victory within the same table composition. Accessible drawers expose history and complete readable space information. Auction interactions make bidder handoffs explicit.

## Cross-Story Dependencies

ST-501’s owner visual approval gates ST-502. The remaining sequence is ST-502 → ST-503 → ST-504 → ST-505, preserving the operability of remaining full-match actions in styled overlays as the table evolves. EPIC-002 remains completed; existing B-09 human reviews and EPIC-003/004 deferrals remain unchanged. Remote hosting, device recovery and private-device full-match rendering are separate future scopes, not dependencies to implement as part of this visual migration.
