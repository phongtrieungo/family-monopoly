---
title: 'ST-602 · Local Phaser table, setup and inspection'
status: in-review
---

## Intent

<frozen-after-approval>

Implement the ST-601 desktop table in the shared-browser local game. Integrate it with existing setup, saved sessions, actor handoff and public inspection. Keep later gameplay decisions on their interim controls until their migration stories.

- Given two to four names entered with keyboard, mouse or Vietnamese composition, when setup submits, then validation and busy status appear at the form, and a lost response can be retried with the existing creation identity. Reload restores the accepted match or saved setup.
- Given a local snapshot, when the table renders, then all 40 authored spaces remain in board order and the accepted tokens, owner, mortgage and development data map to their cells. Shared cells distinguish every occupant and the active token. At the Epic 6 desktop sizes, the board and immediate decision fit together.
- Given a pending decision, when a player opens a deed, seat, space index or history, then only public information is shown and closing restores focus and the same pending decision. All spaces are accessible by mouse and keyboard.
- Given a turn owner and a different actor, when the named actor confirms handoff, then controls unlock for that holder and the accepted revision does not change.

Trace [ST-602](../../specs/epics/EPIC-006.md#st-602--build-the-illustrated-table-setup-and-inspection), AC-33–38, AC-41–42 and the handoff portion of AC-46.

</frozen-after-approval>

## Code map and sequence

1. Adapt the top-down board composition from `design/phaser-table/preview.js` in `src/web/local-board.js`. Keep the existing `createBoardView` lifecycle and motion hooks. Use a common cell coordinate function for painting, motion and hit testing. Preserve reduced motion, skip and teardown.
2. In `src/web/local.js`, extract the body of the existing setup submit handler into a shared setup action. Connect the Phaser setup fields through native text-input composition and semantic navigation. Keep `local-creation`, `local-game`, setup retry and saved credentials under the existing controller.
3. Project the turn owner, selected actor and confirmed holder from the current state and handoff controller. Call the existing handoff action through the same guard. Keep action submission and all authoritative state changes in the current command path.
4. Wire the 40-space index, selected deed, seat details and history to the existing public projection. Use stable IDs to restore focus after closing details and keep the current decision mounted or recover its focus. Make the migrated surfaces visually exclusive while keeping semantic equivalents keyboard accessible.
5. Update the local UI mapping and record the current proposal and the remaining ST-601 manual checks. Confirm the production bridge against the agreed visual direction and validate with real Vietnamese composition and a screen reader before accepting it.

## Verification

Run `bun test` and `bun run build:web`. Extend the existing `scripts/local-play-acceptance.js` fixtures with target desktop checks at a 1280×720 CSS viewport and 1080p, 1440p and 4K displays or equivalents. Verify the mouse and keyboard paths, 2- and 4-seat setup and reload, creation retry, shared cells, all-space inspection, distinct auction actor, and the same pending revision after opening and closing details. Record render-path and manual accessibility evidence separately. Assign the full suite to the story implementer and record evidence against the tested revision.

## Planning evidence

Baseline `ae6e71da05fcdfc8e0f8652dc424428b4037441b`. Scope is one local presentation slice with moderate design ambiguity and high integration risk due to setup persistence and actor handoff. ST-601 preview is on main. Its Vietnamese input-method and screen-reader acceptance are still open. Runtime hook model and token evidence was unavailable.

## Implementation and verification evidence

The production board uses one square coordinate projection for tile art, tokens, motion and mouse hit targets. Setup, seat summaries, handoff, the board index, deeds, seat detail and history use Phaser paint. The native controls retain layout, focus, click targets, form semantics, text composition and dialog scrolling. The existing controller retains creation retry, accepted revisions, handoff and save ownership. Later decision controls follow the Epic 6 migration sequence.

- `bun run build:web` passed and `bun test` passed 69 tests against the ST-602 working tree based on `ae6e71da05fcdfc8e0f8652dc424428b4037441b`. `git diff --check` passed.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bun scripts/local-play-acceptance.js --st-602` passed 1280×720, 1920×1080, 2560×1440 and 3840×2160 Chrome viewports with two and four seats. The runner clicked a canvas cell using browser mouse events, checked the selected deed, inspected a seat, verified focus restoration, acknowledged a different actor without a revision change, reloaded the same match and counted all 40 index controls.
- Manual screen-reader playback and Vietnamese input-method composition remain open. The desktop matrix uses emulated viewports, so it supplies no physical monitor or family playtest evidence.
- Final desktop verification input digest is `59ef3d02c0f5f231cf77042f60767954a0726f073ed11b7baff4fc7113878296`, from `shasum -a 256 package.json bun.lock scripts/local-play-acceptance.js src/web/local.html src/web/local.js src/web/local-board.js src/web/local-panel.js src/web/style.css | shasum -a 256`. Domain, server and Bun test sources are at the recorded baseline.
- The existing Chrome `--st-206` full-match regression passed all four checkpoint journeys, including reload, lost-response command retry and victory. During this run a screenshot exposed a wrapped short balance label. The final desktop matrix was rerun after correcting the wrap.

## Review fixes

Seat-list updates restore the focused inspection button using its seat ID. Phaser text fields mirror native horizontal scrolling and selection, including caret position. Browser checks now wait for painted control pixels, assert that the initial board and handoff fit before scrolling, and exercise a revision update while a seat button is focused.

The final desktop matrix passed all four sizes. A constrained long-name field exercised horizontal scrolling and selection. Manual inspection of the captured 4K setup and 1280×720 handoff confirmed visible selection and controls. The build, 69 Bun tests and whitespace check passed. Final verification-input digest is `63da5dfdbfe91ccaca14ec49ff747ec2b15d3b19dc2e326ef0aa64a29da248ed`, using the same digest command above. The prior full-match run predates these fixes. Manual input-method and screen-reader checks remain open.
