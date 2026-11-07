---
title: 'Dimensional dice tumble'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Make local table dice visually dimensional and show a lively rolling effect before settling on the server-accepted values. Preserve native text, reduced motion, Skip, refresh and server authority; the visual frames never select a game outcome.

</frozen-after-approval>

## Implementation Notes

- Draw original shaded dice with deterministic presentation frames, travel, spin and bounce. Final pips use the accepted roll; Skip and reduced motion settle immediately.
- Verification: 69 Bun tests, web build, ST-203 Chrome desktop/360px reduced-motion acceptance and diff whitespace check passed.

## Review Triage Log

- Rolling faces differ transiently from the accepted roll: intentional visual frames; the native accepted-result text stays visible, and the final faces always match the server.
- Dice jumped at animation start: medium; patched by initializing the starting positions.
- Faces could be revealed while tilted: medium; patched by settling rotation before the accepted faces appear.
