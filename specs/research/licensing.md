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
| Vietnamese labels and copy | `src/web/vi.js`, `src/web/index.html`, `src/web/app.js` | Authored for this project. Fluent-reader review and public name clearance remain open. |
| Layout and styles | `src/web/style.css` | Authored for this project. Uses installed system fonts. No bundled third-party font, image or audio files. |
| C1009 rulebook | External SRC-01 PDF linked in the edition review | Research evidence. No reproduction permission recorded. |
| Full-match board, deed values and decks | `specs/research/content-profile.md` | Authored by Codex on 2026-11-06 after owner authorization for original economy and cards. Reviewed against the board counts and effect definitions for internal implementation. Balance, fluent-reader and distribution review remain open. |
