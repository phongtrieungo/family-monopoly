# EPIC-006 · Phaser canvas game table

**Status:** Planned. The owner requested a Phaser-only visible interface, an illustrated 2D table and cell-by-cell token movement on 2026-11-14.

## Outcome

Families can run the entire shared-browser match in one Phaser canvas. The board is a flat, top-down 2D illustration of the existing Vietnamese neighborhood. Players can follow their token from the starting cell through each traversed cell to the accepted destination.

## Scope and contracts

- Phaser draws every visible game screen and control, including setup and name entry, navigation, seat handoff, turn actions, forms, inspection, status, settings, history, errors and victory. This includes every full-match decision available on the local route. The private-room prototype is outside this epic.
- The host page can supply the canvas mount and nonvisual browser bridges for text composition and assistive technology. All visible interaction remains in Phaser. Preserve Vietnamese input, keyboard and mouse operation, focus indicators, announcements, equivalent space information, readable text and reduced motion.
- Record the successor to the local presentation decision in [ADR-007](../adr/ADR-007-renderer-proposal.md). Update the affected [local play](../local-play.md), [UI and accessibility](../ui-ux.md) and [existing acceptance](../features/local-play.feature) language as each approved slice changes the UI. Keep existing requirement and scenario IDs.
- Preserve the server-authoritative rules, saved sessions, actor validation, accepted revisions, retry receipts and visibility. Phaser renders accepted state and sends commands through the existing local client boundary. Animation never submits or settles a command.
- Use original or cleared art and record provenance in the [licensing manifest](../research/licensing.md). Keep the existing board order and space identities. Verify the target landscape desktop layouts, including the Canvas renderer fallback.

## Table and turn layout

The [digital board-game research](EPIC-006-research.md) informs this direction. The board is the largest continuous area during play. Use a square perimeter of 40 spaces around a quiet illustrated neighborhood center. Group colors, space icons and labels identify properties and landmarks. Token shapes, seat markers and foreground contrast carry the gameplay information even when colors are hard to distinguish. Use a stable top-down camera.

| Layer | What players see |
| --- | --- |
| Shared table | Board, all token locations, current landing highlight, compact seats in stable order and a single decision area. Each seat shows its name, token marker, available cash and relevant status. |
| Current turn | Show whose turn it is, the next actor if different, the current instruction or latest accepted result, and the legal choices for the confirmed actor. When the device is with someone else, replace commitment controls with a named handoff. |
| Details on demand | Selecting a space or seat opens its public details. A turn-details panel shows the current turn's accepted sequence, including actions by other seats. History retains prior turns. Show the name of the actor, action, target and accepted amounts where applicable. |

Target landscape desktop displays at 1920×1080, 2560×1440 and 3840×2160, with a browser viewport of at least 1280×720 CSS pixels. Verify actual viewport and device pixel ratio separately from display resolution. Keep the board, seats and primary decision visible together. Cap the decision column width for comfortable reading and use a scrollable in-canvas sheet for long details. Return focus to the opener or current decision when a sheet closes. Provide a keyboard-operable space index.

The following stories are planned implementation slices. Each story must record the accepted fixtures, observed outcomes and applicable existing scenario regressions.

## ST-601 · Define and validate the table and turn experience

**Player goal.** A family can tell where to look on the table and what to do before learning the full game.

- Inventory the current local route by screen, accepted state, actor, visible fields, commands, validation, feedback and keyboard/mouse behavior. Map each surface to a migration story and a verification fixture.
- Deliver annotated table mockups for the target landscape desktop layouts. Include setup, a normal turn, a divergent auction handoff, card and rent feedback, detailed property inspection, trade, debt and victory. Show long Vietnamese names, four seats and multiple tokens on one cell.
- Specify typography, space and token markers, ownership and development cues, control target sizing, focus order, sheet interaction, error placement and movement states. Primary controls must have a 44 CSS pixel target.
- Demonstrate a canvas field and control with Vietnamese composition, keyboard focus and activation, mouse input, screen-reader labels and a changing status announcement. Record the successor to ADR-007 and the provenance plan for new art.

**Exit.** Review the mockups and interaction proof. From the normal and auction fixtures, a reviewer can locate the affected token or lot, identify who acts next, explain what each choice commits, and recover earlier details. Record the reviewed contract for ST-602–616. [AC-41–42, AC-46](../features/phaser-table.feature)

## ST-602 · Build the illustrated table, setup and inspection

**Player goal.** A family can start or resume a match and inspect the table at a glance.

- After ST-601, support two to four named seats, Vietnamese text composition, inline validation, creation pending/retry states and saved-match entry. Reuse the existing creation identity and seat sessions.
- Render all 40 authored spaces in board order. Each token maps to an accepted cell. Offset shared-cell tokens within the cell and keep the active token distinguishable. Show ownership, mortgages and development using the approved cues. Keep board positions stable when details open.
- Allow space and seat inspection from the table and provide a keyboard- and mouse-operable space index. Deeds expose full name, occupants, owner, mortgage and buildings, plus applicable price and rent. Seat inspection exposes public assets and status. Keep a history surface available during play.
- Distinguish turn owner, current actor and confirmed device holder. A named handoff says who should receive the device and whether the handoff is for a different player's decision. Confirming it leaves match state unchanged.

**Exit.** At the target desktop sizes, check setup and recovery with two and four seats, long names, multiple tokens in one cell and each space reachable for inspection. Verify the underlying pending decision survives opening and closing details. [AC-33–38](../features/local-play.feature), [AC-41–42, AC-46](../features/phaser-table.feature)

## ST-603 · Show the accepted movement cell by cell

**Player goal.** Everyone can follow the same token from its starting cell to its accepted landing.

- After ST-602, present accepted dice and highlight the moving token. Advance through each cell in route order, including wraparound, backward movement and each segment of a chained roll and card move. Mark the landing and display the named space and accepted result in text. Present direct transfers distinctly and keep the token in place on a failed jail roll.
- Use accepted movement facts and revision/event order. If existing events and snapshots cannot distinguish routes, specify the server-authored movement facts and compatibility with older saves before implementing that change. With missing route history, render the accepted position.
- Keep route presentation bounded by timing specified in ST-601. Make Skip reachable by keyboard and mouse and keep legal actions available during motion. Reduced motion, refresh, gaps and newer authoritative state reconcile to the current position. Duplicate responses and resize cannot restart a route or replay a finished animation.
- Turn details preserve the accepted dice, landing, card or transfer reason and any accepted award after motion is skipped or disabled. Announce the outcome without announcing every intermediate cell.

**Exit.** Capture an ordered cell trace for clockwise wrap, backward card movement and a chained route. Exercise direct jail transfer, failed jail roll, duplicate response, resize, Skip, reduced motion and refresh mid-move. Verify final positions and pending decisions match accepted state and animation sends zero commands. [AC-43–44](../features/phaser-table.feature)

## Local decision migration

[ST-604 and ST-606–616](EPIC-006-decisions.md) define the implementation contracts for the decision area. ST-604 is the first playable slice, covering roll, jail, purchase and end turn. The remaining stories each own a bounded set of commands, accepted feedback or turn history. ST-605 is the final cutover and retains its existing ID. Follow the dependency table in the decision plan.

## ST-605 · Finish, restart and verify the complete canvas match

**Player goal.** Everyone can understand how the match ended, look back on play and start another game.

- After ST-603, ST-604 and ST-606–616, show the confirmed winner and final seat summaries in stable order, including final cash, properties and bankruptcy state. Keep final history accessible. Refresh restores the accepted summary without replaying celebration.
- Complete the canvas settings and errors, including opt-in sound, mute, reduced motion, and reconnect/retry status. Preserve unfinished-match replacement confirmation and the existing finished-match restart behavior. Restore focus appropriately after closing settings, dismissing an error or canceling replacement.
- Close the ST-601 inventory. Verify every visible control and gameplay message is rendered by Phaser, including with the Canvas renderer fallback. Preserve the nonvisual accessibility and text-entry bridge.

**Exit.** Run representative two- and four-seat journeys through setup, handoff, purchase or auction, payment, recovery and confirmed victory. Include desktop keyboard and mouse, Vietnamese composition, a manual screen-reader pass, reduced motion and Canvas fallback. Record tested journeys, remaining coverage gaps and the status of [B-09](../playtest-review.md). [AC-33–38](../features/local-play.feature), [AC-41–46](../features/phaser-table.feature)

## Implementation checkpoints and experience proposals

Execute by dependency. The first checkpoint is ST-601 → ST-602 → ST-604 → ST-607, proving a complete roll, declined purchase, auction handoff and recovery on the table. Then complete portfolio, construction, trade and recovery branches in the decision plan. Complete ST-603 → ST-616 → ST-615 for movement and history. ST-605 closes the migration. Each checkpoint must keep the complete local match playable with the documented interim surfaces.

The following enhancements are proposals for later story selection. They have no implementation authorization from this review.

| Proposal | Player benefit and concrete acceptance |
| --- | --- |
| Contextual rule explanation | A “Why?” action beside an unavailable choice explains the applicable rule and the current missing condition, such as uneven buildings or insufficient funds. It uses the same decision data as the action and remains available by mouse and keyboard. |
| Resume summary | After reload or returning to the game, show the current turn owner, person required to act, pending obligation and latest accepted outcome in one dismissible canvas panel. Dismissal changes no game state and restores focus to the pending decision. |
| First-match guided help | An optional short guide demonstrates selection, inspection, handoff and the action area using labeled fixtures. It can be skipped and reopened without sending match commands. |
| Personal presentation preferences | Offer compact or expanded turn detail and adjustable movement speed alongside reduced motion. Preferences persist locally and change presentation timing only. Test with music and SFX independently disabled. |

Prioritize contextual explanation and resume summary after the first auction checkpoint. Their data already exists in the planned decision projections and accepted history.

ST-601 review materials are available in the [Phaser table preview](../../design/phaser-table/README.md) and [proposed renderer decision](../adr/ADR-008-local-canvas-controls.md). Visual and manual accessibility acceptance are pending.

ST-602 production table and inspection are implemented and in review. See the [implementation and verification record](../../_bmad-output/implementation-artifacts/spec-6-602-local-phaser-table.md#implementation-and-verification-evidence).
