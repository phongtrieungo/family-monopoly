# EPIC-005 · One living neighborhood table

**Status:** In progress. The owner approved the redesign plan and directed implementation on 2026-11-08. ST-501 received visual approval. ST-502 is the current authorized slice. EPIC-002 remains completed. B-09 human reviews and EPIC-003/004 deferrals are unchanged.

## Outcome

Present the authored 2–4-player local match as one cohesive illustrated 2.5D game table, with connected player HUDs, contextual actions and temporary transaction overlays. Replace the webpage-panel composition with a warm Vietnamese miniature neighborhood. Prioritize shared desktop/tablet play, retain a usable 360px phone experience, and keep the full match playable throughout migration.

## Approved direction

- Fixed shallow oblique board, dimensional pieces, original Vietnamese shopfronts, trees and tactile materials; bounded overview/focus framing, no full 3D engine or free rotation.
- Player HUDs distinguish turn owner and person holding the device. One action dock names the actor, consequence and amount. Inspection, auctions, portfolios, trades and debt use coordinated overlays over the table.
- Lively short dice/movement/payment feedback, Skip and reduced motion; optional original sound effects enabled deliberately, persistent mute, no music.
- Setup and victory belong to the same table. History and full readable space information remain available through accessible drawers.
- Approve high-fidelity table, purchase and auction mockups before playable-UI implementation. Setup, trade/debt, victory, tablet and phone layouts must also be reviewable.

## Stories and gates

| ID | Slice | Status | Dependency / exit |
| --- | --- | --- | --- |
| ST-501 | Visual contract and mockup approval | Done · owner UI approval 2026-11-08 | Research, DESIGN.md, EXPERIENCE.md, self-contained interactive visual proposal and owner visual approval. |
| ST-502 | Playable table and core turn | Implemented · review pending | ST-501 visual approval; setup → handoff → roll → purchase → next player → rent; remaining full-match actions remain operable in styled overlays. |
| ST-503 | Cards, auctions and transaction feedback | Proposed | ST-502; focused card/payment/auction presentation with explicit bidder handoffs. |
| ST-504 | Portfolio, trade and recovery | Proposed | ST-503; development, mortgages, jail, debt, acquisition and building-shortage workflows. |
| ST-505 | Finish and complete-game acceptance | Proposed | ST-504; victory, audio preferences, responsive refinement and complete local acceptance. |

Implement one authorized slice at a time. The approved plan establishes sequence, not permission to bypass ST-501's visual checkpoint. Future stories need their own approved implementation contracts.

## Preserved contracts

The server owns outcomes, actors, revisions and settlement. Retain Bun, Phaser 3.90.0 and native HTML under [ADR-007](../adr/ADR-007-renderer-proposal.md), Canvas fallback, existing commands and saved sessions. Motion/audio never generate commands. Preserve AC-04, AC-06, AC-11–32 and AC-33–38; no rule, economy, profile, hosting or distribution change is authorized. Use original/cleared assets with provenance in the research manifests. Human review gates remain in [B-09](../playtest-review.md).

## Acceptance

At desktop/landscape tablet widths, show board, player summaries and primary decision without normal page scrolling. At portrait/360px widths, retain the board overview above an internally scrollable decision sheet, with no horizontal overflow or forced rotation. Keyboard, text zoom, touch, reduced motion and readable HTML equivalents remain supported.

Record visual comparisons against approved mockups, browser captures and motion evidence alongside authoritative revision/retry/reconnect verification in each implementation slice. ST-501's demonstration uses explicitly labeled fixtures, not a connected or rules-complete game.

## ST-501 delivery record · 2026-11-08

The [interactive proposal](../../design/game-ui/index.html), [design](../design/game-ui/DESIGN.md), [experience](../design/game-ui/EXPERIENCE.md) and [research](../design/game-ui/RESEARCH.md) are implemented. Correctness and verification-gap reviews completed; verified identity/handoff findings were patched and rechecked. Focused Node checks pass. Browser preset spot-checks and remaining manual gates are recorded in the [implementation spec](../../_bmad-output/implementation-artifacts/spec-st-501-game-ui-visual-contract.md#verification-evidence). Owner approved the UI on 2026-11-08 and requested a PR. ST-501 is Done; ST-502–505 were backlog slices at that checkpoint. Visual approval does not close the remaining manual checks or B-09 gates.

## ST-502 delivery record · 2026-11-14

The local route now presents the accepted match as an illustrated neighborhood with seat summaries, a named device holder, a native decision sheet, and modal inspection and history. The [ST-502 implementation spec](../../_bmad-output/implementation-artifacts/spec-5-502-playable-table-and-core-turn.md#verification-evidence) records browser verification for setup, core turns, recovery and retained full-match controls. The [local UI mapping](../ui-ux.md#st-502-local-table) connects those checks to the existing scenarios. Dedicated presentation for cards, auctions, property management and finish stays in the later slices. B-09 human reviews remain open.
