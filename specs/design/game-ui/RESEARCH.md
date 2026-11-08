# Research for the neighborhood table

ST-501, 2026-11-08. Primary reference text was retrieved on 2026-11-08. This is reference research and an original recommendation, not hands-on comparative gameplay testing. No commercial screenshot, character, board artwork, font, sound or asset was imported. Linked image availability does not establish that gameplay images were visually inspected.

## Evidence and limits

| Reference and locator | What the source actually supports | Evidence category / limit | Our recommendation |
| --- | --- | --- | --- |
| [EA · Monopoly Streets announcement, 6 May 2010](https://news.ea.com/press-releases/press-releases-details/2010/EA-to-Deliver-Dynamic-3D-MONOPOLY-Gameplay-Experience-with-MONOPOLY-Streets/default.aspx), opening announcement and development/property paragraphs | EA described a living 3D city and buildings reflecting development. | Historical publisher announcement about a 2010 release; not proof of present features, usability or this project's architecture. | A neighborhood can communicate progression. Use our own low-cost shallow-oblique SVG/Phaser projection and authored shopfronts, with a fixed overview. |
| [Ubisoft · Monopoly Accessibility Spotlight, 18 September 2024](https://news.ubisoft.com/it-it/article/6KBIQNPgqtAQWeyvX7UTPI/monopoly-accessibility-spotlight), interview on physical interactions and Visuals/Audio lists | The designer describes optional direct/skip interactions; the feature list says information is not communicated solely by fixed color or sound. | First-party accessibility claims, not an independent accessibility audit or our own hands-on findings. | Native buttons and full textual outcomes; Skip/reduced motion; seat shape + name + color; sound off until enabled. |
| [Marmalade · official Monopoly game page](https://www.marmaladegamestudio.com/games/monopoly), About the game / Features | The publisher advertises offline single-device pass-and-play and multiple play modes. | Product marketing claims as retrieved, not verified behavior or permission to import themed assets. | Shared-device turn handoff deserves first-class table space. Preserve this project's explicit actor confirmation and original content. |
| [Caroline Henriksen · Monopoly Front End Redesign](https://www.carolinechenriksen.com/monopoly-front-end-redesign), Overview, Project Goals, UX Wireframes, UI Mockups | The credited designer dates the project April–November 2022 and describes consistency, mobile flow and presentation of existing boards/tokens. | Designer's primary account of front-end work; not gameplay research. Conversion goals do not belong to this family prototype. | Use one visual language from setup to finish; give our original board and pieces room. Do not add shop, monetization, DLC or conversion patterns. |

The four references inform interaction questions and presentation, not rules, edition evidence or feature parity. Their licensed Monopoly material remains reference-only. [Sources SRC-08–11](../../research/sources.md) and [IP-05 / original artifact record](../../research/licensing.md) retain provenance.

## Decisions derived from the owner and project

The owner selected warm Vietnamese illustrated 2.5D, desktop/tablet first, a usable phone view, shallow fixed oblique framing, skippable short motion and optional effects without music. Those are project decisions, not findings proved by the references. The existing Bun/Phaser 3.90 plus native HTML architecture remains ADR-007. ST-501 uses plain local HTML/CSS/JS/SVG to make the proposal reviewable offline without changing production or dependencies.

Original authorship: Codex, for family-monopoly, 2026-11-08. SVG projection, trees, shops, awnings, pond, fountain, four token silhouettes, paper materials and synthesized sine effects are code-authored here. Names, stable space IDs and deed schedules reference `src/domain/vn-original-content.js`. Mock cash, ownership and auction sequence are explicitly illustrative snapshots. No stock art, reference tracing, web font or external asset is included.

## What the proposal needs to establish

1. A cohesive table remains legible during a purchase or bidder handoff: review table, purchase and auction at 1440×900, 1280×720 and 1024×768.
2. The neighborhood remains visible above a bounded decision sheet at 768×1024 and 360×800, without sideways scrolling.
3. A reviewer can follow handoff → roll → landing → purchase → ownership → next player → rent and can identify who holds the device at each commitment.
4. Property detail, auction budget, debt shortfall and two-way trade are readable in native HTML. The miniature artwork must not be the only source of state.
5. Keyboard focus, 200% zoom, Skip, reduced motion and silent default audio remain usable.

These are review questions, not claimed test results. Actual browser captures belong in the implementation spec's Verification Evidence after parent inspection. Owner approved the proposed UI on 2026-11-08; this closes the ST-501 visual checkpoint only. Physical-device, screen-reader, fluent-Vietnamese-reader, family, branding and distribution gates remain open under [B-09](../../playtest-review.md).
