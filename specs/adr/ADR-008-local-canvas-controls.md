# ADR-008 · Visible Phaser controls for shared-browser play

**Status:** Proposed in ST-601. Supersedes the local presentation portion of [ADR-007](ADR-007-renderer-proposal.md) upon acceptance and cutover.

The shared-browser table renders visible controls, text and feedback in Phaser. Native browser elements provide text composition, semantic focus, control labels and announcements. Canvas pointer input and native semantic activation use the same action boundary, with a visible Phaser focus marker. Keep WebGL and Canvas paths playable. Accepted server state remains the source for game decisions, actors and motion.

The [ST-601 preview](../../design/phaser-table/README.md) exercises the visual and input approach with fixtures. Verify actual Vietnamese input and screen-reader behavior on supported devices before accepting the bridge.
