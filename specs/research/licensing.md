# Licensing and asset manifest

The repository carries [Apache-2.0](../../LICENSE). Record third-party permissions separately before importing or distributing material. The prototype contains project-authored specifications, synthetic board data and browser presentation.

| Asset ID | Material | Provenance | Disposition |
| --- | --- | --- | --- |
| IP-01 | Monopoly names, logos, characters and distinctive board elements | Hasbro notices, SRC-02 | Research reference only. Brand and distribution review pending. |
| IP-02 | Rulebooks, cards and board scans | Candidate edition sources, SRC-01 and SRC-03 | Evidence leads only. Track permission before any reproduction. |
| IP-03 | Vietnam visuals, fonts, audio and tokens | Sources pending | Use project-authored or individually cleared assets. |
| IP-04 | Prototype names, synthetic board and copy | Project-authored with Codex in B-02 and B-05 | See the file review below. Public branding review remains open. |

Each imported asset needs a path, author/rightsholder, source, license or permission evidence, modification record, attribution, approved distribution scope and reviewer. Keep required notices with the material. Review public branding and distribution separately from internal prototype access.

## Prototype file review

Codex reviewed the tracked prototype files on 2026-11-06. The owner selected original Vietnamese presentation with translated UI. The review records current provenance and open gates.

| Material | Paths | Provenance and disposition |
| --- | --- | --- |
| Synthetic board and economy | `src/domain/synthetic-board.js`, `test/fixtures/property-turn.js` | Authored for this project. Values are synthetic and must remain labeled as such. |
| Vietnamese labels and copy | `src/web/vi.js`, `src/web/index.html`, `src/web/app.js`, `src/web/local.html`, `src/web/local.js`, `src/web/local-controls.js`, `src/web/local-vi.js` | Authored for this project. Fluent-reader review and public name clearance remain open. |
| ST-206 finish treatment | `src/web/local.html`, `src/web/local.js`, `src/web/style.css`, `src/web/local-board.js` | Project-authored Vietnamese finish copy and CSS border/shadow celebration, created 2026-11-07. Internal code/provenance review: no third-party image, audio, font or other asset imported. Fluent-reader, family, branding and distribution approvals remain open under B-09. |
| Layout and styles | `src/web/style.css` | Authored for this project. Uses installed system fonts. No bundled third-party font, image or audio files. |
| ST-202 Phaser renderer | `src/web/local-board.js`, generated `src/web/build/local-board.js` | Board geometry, color palette and renderer code are project-authored; labels and state come from the existing authored content and authoritative snapshot. Phaser 3.90.0 and its eventemitter3 dependency are MIT; retain the reviewed notices under `spikes/st-201/licenses/`. Internal prototype only. |
| C1009 rulebook | External SRC-01 PDF linked in the edition review | Research evidence. No reproduction permission recorded. |
| Full-match board, deed values and decks | `specs/research/content-profile.md`, `src/domain/vn-original-content.js` | Authored by Codex on 2026-11-06 after owner authorization for original economy and cards. Reviewed against the board counts and effect definitions for internal implementation. Balance, fluent-reader and distribution review remain open. |

## ST-201 renderer spike provenance and review

Codex inspected the installed package metadata and bundled MIT notices on 2026-11-06. The isolated spike uses Phaser 3.90.0 (Richard Davey / Phaser Studio Inc.), React 19.2.0 and React DOM 19.2.0 (Meta Platforms, Inc. and affiliates), with eventemitter3 5.0.4 (Arnout Kazemier) and scheduler 0.27.0 (Meta Platforms, Inc. and affiliates). All five installed package manifests declare MIT; their notices are retained in `spikes/st-201/licenses/`, and `bun.lock` pins the exact resolved packages. Phaser's optional third-party plugins are not imported by the spike. Review the final bundled material, notices and intended distribution scope before shipping; internal evaluation is not public distribution approval.

The spike's geometric board, tokens, page layout, card treatment, copy, screenshots and movement recording were authored for this project in B-11. System fonts are used; no imported font, image or audio asset is included. They are internal visual drafts; fluent-reader, branding, family and public distribution reviews remain open.
