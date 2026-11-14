# UI and UX

## EPIC-005 visual proposal

The owner approved a cohesive illustrated 2.5D Vietnamese neighborhood table direction on 2026-11-08. ST-501 / B-18 produces the [design contract](design/game-ui/DESIGN.md), [experience contract](design/game-ui/EXPERIENCE.md), [cited research](design/game-ui/RESEARCH.md) and [isolated interactive mockup](../design/game-ui/index.html). The owner approved the mock on 2026-11-08. ST-502 brings the approved direction to shared-browser play. B-09 human gates remain open.

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

The [B-09 review](playtest-review.md) records accessibility findings and remaining checks. The [local-play page](local-play.md) accepts 2–4 names, renders the authored board and offers full-match decisions. It names the person holding the device and requires an explicit handoff before their actions. Auctions and building demand expose a person selector. Debt and acquisition prompts identify the responsible seat. Property management and trade forms show amounts before submission. On narrow screens, the board sits above the internally scrollable decision sheet. Native dialogs provide the complete 40-space list and accepted history.

Session storage holds the local seat bundle, latest public snapshot and any unresolved command. Reload restores the pending decision and requires handoff again. The retry control submits the original command and actor after a lost response. Unrevealed deck order is never stored in the client.

## ST-502 local table

The oblique board projects accepted dice, movement, ownership and development. Seat summaries identify the active seat, cash and property count. The dock names the confirmed device holder or the person expected to receive the device. The purchase deed shows the full name, group, price, basic rent and resulting cash. Accepted purchase and rent remain visible as text. The native list identifies all 40 spaces and opens full deed or space details, including occupants and the active seat location. Escape or Close returns focus to the opener.

| Flow | Preserved scenario evidence |
| --- | --- |
| Setup, named handoff, accepted purchase and rent | [AC-33–34](features/local-play.feature), [AC-04/06](features/turn.feature) |
| Refresh, retry, receipt replay and handoff | [AC-36](features/local-play.feature) |
| Card, auction, trade, jail, building, debt, acquisition and finish | [AC-35/37](features/local-play.feature), [authored full-match cases](features/full-match.feature) |
| Keyboard, phone and authoritative result equivalents | [AC-38](features/local-play.feature), [AC-10](features/interface.feature) |

See the [ST-502 verification record](../_bmad-output/implementation-artifacts/spec-5-502-playable-table-and-core-turn.md#verification-evidence).

## ST-503 cards, auctions and transaction feedback

The shared local decision sheet shows published Vietnamese card text alongside the accepted result. Payment feedback names the parties, amount and cause when available and shows current synchronized balances. The auction deed identifies the item, leading bid or opening price, selected bidder and available cash. Bid and pass remain native actions gated by the existing device handoff. Accepted settlement or all-pass appears as a single result, and the existing activity dialog provides a readable event record.

| Flow | Existing scenario contract |
| --- | --- |
| Published cards and accepted payments | [AC-06](features/turn.feature), [AC-14–18 and AC-31](features/full-match.feature) |
| Property and final-building auctions, bidding and explicit device handoff | [AC-11–13 and AC-24–25](features/full-match.feature), [AC-35](features/local-play.feature) |
| Refresh, retry and native controls | [AC-36 and AC-38](features/local-play.feature) |

Implementation and unrun checks are recorded in the [ST-503 spec](../_bmad-output/implementation-artifacts/spec-5-503-cards-auctions-transaction-feedback.md#verification).
