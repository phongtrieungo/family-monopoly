# ST-201 · Renderer comparison

This is an isolated, synthetic presentation experiment. It uses the existing synthetic property-turn reducer in a separate in-memory fixture server and never reads or writes a real room store. The two boards consume the same accepted `Roll` event and revision. It is not a playable full match and records the comparison that informed the owner’s Phaser plus native HTML decision.

## Run the sample

With Bun 1.4.4:

```sh
cd spikes/st-201
bun install --frozen-lockfile
bun run start
```

Open `http://127.0.0.1:3001`. The roll is fixed at `[1, 1]`: the server reducer accepts it and places Mai at the synthetic purchase space. The fixture can be reset without touching a local match. `?renderer=canvas` forces Phaser Canvas; `?renderer=webgl` requests WebGL. The default uses Phaser AUTO. Both boards share a presentation animation clock; neither renderer produces authoritative moves or dice. Skip or reduced motion displays the committed destination immediately.

## Reproduce verification

```sh
CHROME_BIN=/path/to/chromium bun run verify
```

The runner builds locally, starts the isolated server on loopback, runs Chrome with Canvas, WebGL via SwiftShader, simulated unavailable WebGL, and React/SVG, and writes evidence to `evidence/`. It checks the accepted roll, stale and duplicate requests, 1280px and 360px layouts, space-list focus, reduced motion, skip and refresh. The recording captures the Phaser canvas while both views update from the same accepted state. Chrome is a prerequisite for the runner, not a bundled dependency.

- [Desktop Canvas and SVG](evidence/desktop-canvas.png)
- [Desktop WebGL and SVG](evidence/desktop-webgl.png)
- [360px Canvas and SVG](evidence/phone-canvas.png)
- [Short movement recording](evidence/movement.webm)
- [Comparison and review](../../specs/epics/ST-201-comparison.md)

The captured images, video and geometric artwork are project-authored internal draft material. Package notices are in `licenses/`; the package lock pins the evaluation dependencies. Review branding, Vietnamese copy, physical accessibility and distribution separately before wider playtesting.
