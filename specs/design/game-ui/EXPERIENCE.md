# One living neighborhood table · experience contract

ST-501 / B-18. **Owner visual approval recorded on 2026-11-08; ST-501 complete.** [Design](DESIGN.md) defines appearance, [research](RESEARCH.md) distinguishes evidence, and the [mock README](../../../design/game-ui/README.md) explains what can be tried. Existing rule, requirement and scenario identifiers remain unchanged. This document proposes presentation of accepted state; no reducer, event, session or permission change is authorized.

## Shared-device rhythm

The owner of the turn and the person holding the device are different concepts. Show the turn owner's HUD marker throughout, and name the current device holder in the dock. Before a new seat can commit, show “Chuyền máy cho [name]” and require that person to receive the device. Merely inspecting a property never changes the actor. Auction, trade, debt and acquisition use the responsible decision actor, which may differ from turn owner.

The full match begins on the same table: two required names, up to two optional seats, token labels and a deliberate start. Production setup must explain retained-session replacement and avoid deleting a live game by accident. The isolated mock always shows four sample seats and calls out that empty optional names become sample guest labels; it does not implement genuine seating or persistence.

| Moment | Visible information and direct action | Next / recovery behavior |
| --- | --- | --- |
| Setup | Names, distinct pieces, 2–4-seat contract, current-session choice. | Validate names; create only when explicitly started. Mock only updates labels in memory. |
| Handoff | Turn owner, recipient and reason. | Recipient confirms; restore turn heading focus. Refresh requests handoff again. |
| Roll | Actor, accepted dice total, destination, Skip. | Server result first; short motion projects it. Reduced motion/skip/reload lands at same state. |
| Landing | Full space name, cause (including card/jail), resulting cash or decision. | Present legal next action; rejected result is not animated as success. |
| Purchase | Property, price, current/after cash, rent and full details. Buy or decline to auction. | Result records ownership; lost response retains original intent for recovery. |
| Ownership | Owner shape/name, amount paid, resulting cash, asset in portfolio. | End turn remains explicit; no motion-dependent advance. |
| Next player | Named handoff with previous result visible. | Confirm next actor before their controls. |
| Rent / fees | Payer, recipient, basis and accepted amount. | Text confirms accepted payment; debt diverts to lawful resolution before next turn. |
| Victory | Confirmed winner, final public state of all seats, history and optional celebration. | Keep results available; no auto-reset. New match follows deliberate setup. |

The mock's storyboard intentionally selects a sample roll of 1+2 from Phí cảnh quan (position 38) to Ngõ hoa Hà Nội (position 1). Buy shows 80 xu paid and 960 xu remaining from 1,040; the next-player scene then illustrates Bình paying 4 xu rent. These are selected review fixtures referencing authored content, not a new economy or an executed authoritative match.

## Inspection and management

“Xem đủ 40 ô” opens native full names with stable IDs. Choose a property to read its group, purchase price, rents at each building stage, building cost, owner, mortgage and building state. Transit and service detail uses its authored schedule/basis. Special spaces explain their purpose. The decorative overview never needs precision clicks or supplies exclusive information. Closing details returns focus to the opener; a list-to-detail replacement retains an accessible heading and an explicit route back to the list.

Future portfolio surfaces offer legal build, sell, mortgage and redeem choices with amount and consequence before commit. Show bank stock and eligible group constraints. Do not make an ineligible action look enabled; state the reason. Keep the board and current actor context. The mock demonstrates property detail and mortgage consequence, not a complete portfolio manager.

## Auctions, trading and obligations

An auction overlays a deed and current price on the table. Name current leader, eligible responsible bidder, available cash, new bid, and pass. Hand off before accepting a bid; no speed-based countdown. Validate whole-number amount, above-current price and budget, while the server remains the final authority in production. Show accepted new price, then hand off the next actor. A rejected amount leaves input and context intact. The mock explicitly demonstrates a fixed selected bid sequence; its three-pass ending is an illustrative transition, not a new auction rule.

Trading displays two directional lists including cash, full property names, building and mortgage states. The recipient sees the complete offer before accept/reject and explicitly receives the device. Stale ownership/cash or an invalid offer returns an explanation without silently changing terms. Any mortgage acquisition obligations are a separate named recipient decision, never an incidental toast. The mock's fixed offer does not implement editing or asset settlement.

Debt stays in focus until resolved. Name debtor, creditor, amount due, available cash and missing amount. Each liquidation choice previews exact asset and cash effect before confirmation. Explain that mortgage suspends rent; show redemption obligation when relevant. Bankruptcy gets its own clear consequence review: eliminated seat, recipient/transfer and outstanding acquisition obligations. Announce a winner only after engine-recorded completion; do not infer one from the visible number of solvent seats. The mock shows selected mortgage/liquidation outcomes only, clearly labeled.

Building shortage identifies available houses/hotels, requested types, competing actors and the engine-selected acquisition process. If bidding is required, reuse the auction actor/handoff pattern and show the precise stock/item being awarded. Do not silently substitute a building or create stock. Encumbered-property acquisition identifies each property, recipient, required costs/choice and remaining queue; preserve this context across reload before completing debt/victory. These are future contract surfaces, not interactive fixtures in ST-501.

## Jail and cards

Jail detail distinguishes visiting, being held and forced transfer. Include cause, attempt count, available release card(s), lawful payment/roll options and exact current cost from state. Every alternative names actor and consequence; a failed attempt is a textual result, not an animation-only message. A forced-jail projection goes directly to the accepted destination with an explanation.

Card reveal shows only the card text actually published by the authoritative event, then a plain-language accepted movement/payment/repair result. Do not expose future card order, hidden sessions or credentials. Continue/skip affects presentation only. Cards, jail and shortage/acquisition retain full native HTML equivalents in the eventual Phaser projection under ADR-007.

## Accepted-state and recovery boundary

Production remains server-authoritative and deterministic. A legal-looking button is only a request: actor and revision must be validated, retry keeps the original idempotency identity, and state/event projection follows accepted results. No animation callback sends a game command, changes cash, awards ownership or chooses the next player.

| Boundary | Presentation rule |
| --- | --- |
| New accepted event | Update public snapshot and readable outcome, then animate only that known change. |
| Same revision / UI re-render | Preserve accepted state; do not replay cash, rolls or ownership feedback as another transaction. |
| Rejected actor / stale revision | Explain rejection, preserve input where safe, resync and request correct actor. Never imply success. |
| Lost response | Retain pending intent and actor; prohibit a second replacement commitment while result is uncertain. |
| Reconnect / refresh | Keep last board and pending decision visible, lock commits until synchronized, reconcile result and require handoff again. |
| Retry | Original command ID/actor/revision follows existing retry contract; read the result and avoid duplicate settlement. |
| Event gap | Fetch authoritative snapshot; snap to destination instead of fabricating missing motion. |
| Visibility | Public shared-table state only; no undisclosed deck order or other seats' credentials. |
| Reduced motion / Skip | Equivalent outcome, focus and controls; no gameplay delay or mandatory gesture. |

The recovery fixture is deliberately a simulation button, not an automatic reconnection spinner. It first shows disabled transaction controls and retained purchase context, then “Đã đồng bộ · minh họa”, then requires An to receive the device before the purchase fixture. The explanatory retry dialog does not send a request. There are no game APIs, storage changes or network calls anywhere in the mock.

## Responsive, focus and announcements

Desktop/landscape aligns board, four seat summaries, decision and dock in one view. Focused decisions scroll inside their surface at short landscape heights, keeping the board in place and paired decision actions together in a sticky footer. Portrait/phone orders HUD → board overview → actor dock → bounded decision sheet with internal vertical scrolling. At extreme zoom or short windows, page reflow is allowed so controls remain reachable. Details/history are native modal dialogs with readable content and visible close/back controls. They must remain reachable with keyboard, touch and 200% text/browser zoom without horizontal scrolling. Review all five named viewport sizes in the [README matrix](../../../design/game-ui/README.md).

Fixture selection stays focused in the explicitly separate review toolbar; product transitions focus the new decision heading. Dialog open focuses its heading, traps keyboard via native dialog behavior, and close/Escape returns to opener where available. Announce accepted mock interactions through a polite live region and visible toast. Transient toast text is supplementary; material result remains in the decision. No essential outcome depends on color, audio or motion.

## Traceability and staged delivery

| Existing acceptance area | ST-501 review representation | Later executable gate |
| --- | --- | --- |
| AC-04, AC-06 | Roll/landing/purchase/ownership storyboard and deed details. | ST-502 authoritative core-turn projection. |
| AC-11–32 | Cards, auctions, trade, jail, debt, bankruptcy, shortage/acquisition and finish contracts. Auction/trade/debt/victory fixtures. | ST-503–505 full-match decisions; preserve existing scenarios. |
| AC-33–34 | Shared-table setup, HUDs and named actor handoff. | ST-502 sessions, legal commands and actual 2–4 seats. |
| AC-35–36, AC-38 | Auction handoff and recovery/skip/HTML contracts. | ST-503–505 revision, retry, reconnect, visibility and input acceptance. |
| AC-10 / B-09 | Reviewable responsive proposal, native controls, motion/audio choices. | Physical device, screen-reader, fluent-reader, branding/retention and family reviews. |

No Gherkin scenario is changed because no approved behavior changes in production. Parent owns actual browser visual evidence for this mock. Owner visual approval of the high-fidelity table, purchase and auction plus setup/trade/debt/finish/responsive states gates ST-502. Do not mark ST-501 Done until that approval exists. EPIC-002 remains completed with its optional retrospective and every existing B-09 human gate open.
