---
title: 'Animated table dice'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Show two original dice on the local Phaser table when the server accepts a roll. Animate their movement briefly using the accepted values, with reduced motion and Skip showing the same result immediately. Keep native text, server authority and existing match behavior intact.

</frozen-after-approval>

## Implementation Notes

- B-17: project-authored Phaser dice draw accepted values; existing token animation drives optional dice movement, including a roll without movement. Skip and reduced motion snap to accepted values. Native roll text remains available.
- Review: a roll without movement did not animate (medium; patched); scene rebuild could retain destroyed dice objects (medium; patched).
