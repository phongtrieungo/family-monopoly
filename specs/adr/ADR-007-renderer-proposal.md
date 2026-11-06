# ADR-007 · Renderer for the local game table

**Status:** Accepted by the owner on 2026-11-06: Phaser plus native HTML. Evidence: [ST-201 comparison](../epics/ST-201-comparison.md).

## Context

EPIC-002 calls for a game-centered local board, animated accepted outcomes, and accessible controls for children and adults. The existing local UI is native HTML and JavaScript and the game engine is server authoritative. ST-201 compares Phaser 3.90.0 with React 19.2.0 and SVG using the same four-space synthetic server input.

## Decision

Use Phaser for visual board scenes and native HTML for controls, text, the equivalent space list and announcements. Bundle locally with pinned dependencies and retain notices. Use automatic renderer selection with Canvas fallback and never require a WebGL-only effect for essential play. Treat the renderer as a projection of committed revisions and events; skip, refresh and reduced motion must reconcile to the server snapshot. Retain the existing authorized room and command boundaries.

## Tradeoffs and remaining review

The Phaser diagnostic bundle was substantially larger than the React/SVG diagnostic bundle in ST-201. Phaser has a game scene and renderer selection, but this four-space experiment does not measure a full-board workload or compare independently implemented animation systems. A canvas also requires a maintained HTML equivalent. React/SVG was evaluated in the spike; revisit the decision through a new ADR if later evidence warrants a change.

The owner selected Phaser plus native HTML after the spike. This decision does not approve a final illustration style or close B-09's human, accessibility, branding or distribution gates. No rule or digital policy changes are proposed.
