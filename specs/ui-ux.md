# UI and UX

| View | Desktop | Mobile |
| --- | --- | --- |
| Entry and lobby | Create/join view with invite, seat list and ready controls | Single-column flow with share and copy controls |
| Match | Board beside turn prompt and player summaries | Board overview, accessible space list and persistent current-action area |
| Property and auction | Details and ledger next to board | Full-width panel with price, legal actions and status |
| Reconnecting | Keep last view with connection banner | Keep pending action visible and disable submission until synced |

The current actor, phase and required action appear together. Show price and consequence before buying or bidding. Confirm commitment via the server result and preserve context when an action is rejected. Show waiting status to other seats, announce accepted outcomes, and restore focus after dialogs. Use accessible names, clear focus indicators, keyboard operability and text or icons alongside colors. Support reduced motion. Use 360 CSS pixels and desktop widths as prototype review targets, with a 44 CSS pixel target for primary touch controls.

For B-13, animate only movement from a newly accepted `Rolled` event toward the snapshot destination. Keep accepted dice, landing and forced-jail explanation in text. Motion is skippable, yields to reduced-motion settings and never disables legal action controls; refresh and event-gap recovery snap to the authoritative snapshot.

Vietnamese-first copy uses localization keys and Unicode with diacritics. Review terms for cash, rent, bid, decline and end turn with a fluent reader before wider testing. Use fixture values with a visible prototype label.

## B-05 prototype

The local browser client polls for an authorized snapshot and committed events by revision. It keeps the seat credential in session storage for refresh. A failed sync keeps the last board and action prompt visible while disabling submissions. Successful sync restores the controls. When an action disappears after a committed transition, focus moves to the turn heading. The activity list and live announcement describe accepted dice, purchases, rent, and auction outcomes in Vietnamese.

## B-10 shared-browser local client

The [B-09 review](playtest-review.md) records accessibility findings and remaining checks. The [local-play page](local-play.md) accepts 2–4 names, renders the authored board and offers full-match decisions. It names the person holding the device and requires an explicit handoff before their actions. Auctions and building demand expose a person selector. Debt and acquisition prompts identify the responsible seat. Property management and trade forms show amounts before submission. On narrow screens, action controls precede the board and detailed space list.

Session storage holds the local seat bundle, latest public snapshot and any unresolved command. Reload restores the pending decision and requires handoff again. The retry control submits the original command and actor after a lost response. Unrevealed deck order is never stored in the client.
