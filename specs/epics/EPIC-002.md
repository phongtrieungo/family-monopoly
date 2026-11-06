# EPIC-002 · A delightful family game on one shared screen

**Status:** Proposed plan, revised after owner feedback on 2026-11-06. Local play is the highest priority. Implement one approved backlog slice at a time. The wider-playtest gate in [B-09](../playtest-review.md) remains open.

## Outcome

Turn the current functional local prototype into a board game that feels inviting, understandable and fun for children and adults to play together on one computer or tablet. The board is the center of the experience; players can immediately see whose turn it is, what happened, and what decision comes next. Keep a complete 2–4 player `vn-original-v1` match playable from setup to winner on one shared browser.

The current screen presents many controls and long lists like a web administration page. This epic reworks the presentation and the sequence of decisions around the game itself. It also refines confusing workflows uncovered in play, while preserving existing tabletop rules and digital policies unless a specific change is approved and documented.

## Family experience and visual direction

- **A table for the whole family:** a prominent, readable board, colorful neighborhood groups, distinct player tokens, friendly original illustrations and a clear sense of place. Aim for warm, playful Vietnamese neighborhoods without copying a commercial board, card design, mascot or other protected artwork.
- **One decision at a time:** guide the family from handoff to roll, movement, landing and the next choice. Put the current action and its consequence beside the board; reveal less-frequent management actions when needed. Make the active player, dice result, balance and ownership clear at a glance.
- **Visible cause and effect:** animate authoritative dice results, token movement and landing, property purchases, rent/payment, card reveals and winner celebration. Use restrained, skippable animations that never conceal amounts or force players to wait for correctness.
- **Readable for different ages:** short Vietnamese instructions, clear symbols paired with text, large targets and a readable alternative for every board space and event. Avoid relying on color, animation or sound alone. The chosen copy and illustration style still need the B-09 fluent-reader, branding and family reviews.
- **Make decisions feel like play:** use contextual property and card panels, a legible auction scene, simple trade composition and a guided debt path. Show costs, recipients and consequences before commitment. Give players a way back before a transaction is submitted.

## Technology recommendation

**Recommend Phaser for the animated board and game presentation, with accessible HTML controls and information alongside it.** Phaser provides a 2D browser game scene and supports WebGL and Canvas rendering, which fit tokens moving around a board and timed visual effects. Use Phaser's renderer selection with a Canvas fallback; verify the specific pinned version and fallback behavior during the first technical slice. Some Phaser effects require WebGL, so essential information and interaction cannot depend on those effects. [Phaser overview](https://docs.phaser.io/phaser/getting-started/what-is-phaser) · [renderer setup](https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game) · [effect limitations](https://docs.phaser.io/phaser/concepts/fx).

React with SVG is a credible alternative for a primarily interface-driven board: React organizes controls into components, and SVG offers scalable, inspectable elements. It would integrate naturally with accessible DOM interactions, but the team would build more of the scene, animation timing and visual effects itself. React plus a separate WebGL layer would add another renderer and synchronization boundary. [React component model](https://react.dev/learn) · [SVG in HTML](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_in_HTML).

For the current zero-dependency Bun/ES-module project, start with **Phaser plus the existing native HTML/JavaScript interface**, rather than adopting React at the same time. Add an explicit dependency, lockfile, Bun build/serve workflow and license/provenance record in the technical slice. Do not require CDN access. The recommendation is provisional until the first playable spike demonstrates readable layout, performance, fallback rendering and accessible equivalents; document the accepted decision in a new ADR if it passes. If it fails, record the evidence and reassess React/SVG before building subsequent slices.

### Authority and accessibility boundary

The server remains the authority for actor, state revision, dice, outcomes, transactions and retries. Phaser consumes committed snapshots and events as a **view** and sends user intents through the existing authorized command path. Visual dice must show the server's accepted values; animation completion never submits, settles or changes a game rule. On reconnect, a missed event, a duplicate event or a refresh, reconcile to the latest authoritative snapshot; do not replay a payment or invent movement. Record revisions in presentation tests.

Canvas content needs equivalent HTML: a keyboard-operable space list with occupants and ownership, named controls, turn and outcome announcements, visible focus and text explanations. Respect `prefers-reduced-motion`, offer a way to skip or disable optional motion, and ensure every decision completes without animation. Support 44 CSS-pixel primary touch targets and the existing 360px and desktop review widths. Real screen-reader and physical-device checks remain B-09 gates.

## Proposed implementation slices

These are planning labels, not assigned backlog IDs. Convert only the next selected slice into an authorized backlog item before implementation. Every slice must leave the local game playable and preserve existing scenario IDs.

| Slice | Player story and scope | Acceptance evidence |
| --- | --- | --- |
| S1 · Visual direction and renderer spike | As a family, we want to recognize the board as a playful game. Produce a reviewable original art direction and a minimal Phaser board with a few spaces, two tokens and a server-driven movement demonstration. | Compare Phaser against React/SVG using this project's board, at desktop and 360px. Verify WebGL/Canvas fallback, resize, reduced motion, HTML space-list equivalent, Bun build and asset licensing. Capture screenshots and a short motion demonstration. Record the decision and limitations; no profile or rules change. |
| S2 · Game table and setup | As a family, we can create a local game and understand the whole table. Replace the form-first layout with a 40-space board, player areas, tokens, contextual actions and an inviting 2–4 player setup. | Existing local matches and sessions resume. All 40 names, occupants, ownership and current actor are readable visually and through HTML. Keyboard and touch complete setup and handoff; no horizontal overflow at 360px. Original assets have recorded provenance. |
| S3 · Turn and landing | As the active player, I can follow a roll and see where my piece goes. Present server dice, token movement, landing highlights, turn handoff and purchase/decline in a clear sequence. | Animation matches committed dice and destination, including wraparound and forced movement. Buy/decline shows price and consequence; refresh, skipped motion and repeated events leave the same state. Validate AC-04, AC-06, AC-17, AC-29 and AC-33–34/36/38 in relevant local flows. |
| S4 · Cards, payments and auctions | As a family, we can understand the result of a card, a rent payment or a bid without reading a log. Add contextual card reveals, payment feedback and an accessible shared-screen auction experience with explicit bidder selection. | Card text, creditor, amount, current bid and settlement are visible and announced. Every eligible bidder can act from the shared device; passing and settlement remain server-controlled. Cover AC-12–15, AC-18, AC-22 and AC-35–36; verify duplicate/lost responses settle once and reduced motion preserves information. |
| S5 · Manage, trade and recover | As a player, I can find what I own and make a difficult decision step by step. Redesign property management, development, trades, jail, acquisition and debt around understandable choices and consequences. | A guided debt flow shows what is owed, cash, lawful ways to raise funds and bankruptcy consequences. Trade review identifies both sides before confirmation; jail, shortage demand, mortgage and hotel liquidation remain operable. Cover AC-11, AC-19–21, AC-24–28 and AC-30–32 plus AC-37–38. Rejections preserve context and do not present invalid outcomes as accepted. |
| S6 · Finish and family acceptance | As a family, we can finish a full game and celebrate the result. Add a winner scene, end-of-game summary and new-game path; run a coherent local acceptance journey. | Scripted 2- and 4-seat browser runs cover setup, turn, purchase, auction, card, debt, trade, reconnect and winner at desktop and phone widths. Confirm server results, no duplicate payments, keyboard/touch, focus, reduced motion and readable alternatives; retain B-10 regressions. Record real family observations separately from emulation and keep B-09 human review gates open until evidence exists. |

## Presentation acceptance

A reviewer can play a complete local game without needing a separate web-style dashboard to understand the next action. Visual and text representations agree on active player, positions, ownership, balances and pending decisions. The next decision is clear after movement, payment, a card, auction, debt and reconnection. Illustrations, animations, optional audio and celebration do not delay or change a committed outcome. Children and adults can distinguish tokens and read action consequences; verify this with family observations rather than assuming it from aesthetics.

## Assets and motion

Use project-authored or explicitly cleared visuals, typefaces, icons, effects and optional audio. Record source, license/permission, modifications and review in the [licensing manifest](../research/licensing.md) before import or distribution. Start with a compact asset list for board, tokens, dice, property groups, cards and feedback; budget for mobile loading and fallback states. No sound is required to understand play; any added sound must have an explicit mute control and respect device/browser settings. Do not add copyrighted game imagery or reproduce proprietary board/card text.

## Sequencing beyond this epic

- [EPIC-003](EPIC-003.md): full-match private rooms on separate devices, after local presentation is proven.
- [EPIC-004](EPIC-004.md): operational readiness for any future wider or remotely hosted play, scoped only after the owner chooses that direction.

## Open product decisions

The first slice should produce a concrete art-direction sample for owner review. Preferred illustration style, music/sound, age range for usability sessions and level of visual detail remain open. B-09's fluent-reader, branding/distribution, physical-device, accessibility, balance, retention and abandonment reviews continue independently; this epic must not claim those approvals without evidence.
