# ST-601 · Phaser table design preview

From the repository root, run `bun install` if dependencies are missing, then `python3 -m http.server 8765 --bind 127.0.0.1`. Open [the preview](http://127.0.0.1:8765/design/phaser-table/). Start at the purchase decision. Decline to see the auction handoff. Use the arrows to cycle through the eight fixture screens. These fixtures illustrate interface states with no live match connection.

| Layout | Design annotation |
| --- | --- |
| Desktop 1920×1080 | Full top-down board on the left. Seats and the active decision stay visible beside it. |
| Desktop 2560×1440 and 3840×2160 | Enlarge the board and labels while bounding the width of the decision text. |

Original drawn geometry uses deep green borders, warm paper, muted roofs and a pond. Georgia with system serif fallback supports the prototype typography. Production uses readable space names in a keyboard-operable index, text and symbols alongside ownership colors, and count markers for development. Tokens use seat numerals as well as colors, with offsets for multiple occupants. Use 44 CSS pixel targets for primary controls. Keep card, trade and debt details in a dismissible sheet with focus restored to the opener. Show pending and rejected actions beside their decision. Show a static landing marker and text in reduced motion. Derive movement segments and timing from the accepted route contract in ST-603.

| Local surface | Owner and fixture |
| --- | --- |
| Setup, seat identity, handoff, deed and board index | ST-602. Four seats, long names, two pieces sharing a cell, named auction handoff. |
| Dice, accepted movement, landing and Skip | ST-603. Forward, wraparound, backward, direct transfer and reduced motion. |
| Roll, jail, buy, decline and end turn | ST-604. Landing, price, insufficient cash and next actor. |
| Card and payment, auction | ST-606–607. Revealed card and rent, bidder distinct from turn owner. |
| Portfolio and development, scarcity and liquidation | ST-608–611. Holding inspection, stock change and final-building responses. |
| Trade, debt and acquisition | ST-612–614. Both sides of an offer, named debtor and recovery choices. |
| Turn details | ST-615–616. Accepted facts grouped by turn, including actions by another seat. |
| Victory, settings, errors and recovery | ST-605. Accepted winner, music and sound settings when available, and refresh with a pending decision. |

All visible preview controls are Phaser objects. The native input supports browser text composition and the assistive buttons mirror canvas actions. The live region announces the next fixture or confirmed handoff. Test Tab and Enter, mouse activation, a Vietnamese input method, and VoiceOver or another screen reader. In production, scope keyboard focus to the open sheet while it is active and restore the opener or current decision on dismissal. Native text composition and assistive technology require manual device checks before recording acceptance.

The preview uses original Phaser geometry, the existing authored board data and the installed Phaser dependency. Record provenance and approved distribution for future art in the licensing manifest.

## Verification evidence

- A headless Chrome run at a 1920px-wide viewport activated the semantic controls through purchase decline and bidder handoff. Deed inspection and turn details hid the bid action while open. Closing by button or Escape restored opener focus and the confirmed bidder's decision.
- The same run checked visible setup validation by exercising the empty-name path, then entered a Vietnamese name programmatically and advanced to the decision fixture. Manual Vietnamese input-method composition, physical mouse and keyboard behavior, and screen-reader playback remain review items.
- `node --check design/phaser-table/preview.js` and `git diff --check` passed. The existing Bun suite passed 69 tests.
