# One living neighborhood table · visual contract

ST-501 / B-18, 2026-11-08. **Owner approved the UI on 2026-11-08. ST-501 is complete as an isolated mock and visual contract.** This contract does not authorize ST-502 or change game rules. [EPIC-005](../../epics/EPIC-005.md) defines the migration boundary; the [experience contract](EXPERIENCE.md), [research](RESEARCH.md) and [reviewable mock](../../../design/game-ui/index.html) belong together.

## Direction and diagnosis

The current `src/web/local.html` divides the board, players, actions and history into independently bordered webpage panels. `style.css` moves actions before the board at narrow widths. `local-board.js` uses a square canvas with mostly vacant center and small perimeter labels. These are inspected implementation facts, not family-testing findings. Leave those production files intact for ST-501.

Our proposal is an original Vietnamese miniature neighborhood on a warm paper-and-wood table: fixed shallow oblique floor, upright shopfronts, small trees, a pond and a planted square. This direction comes from the owner's confirmed choices. It is not a reproduction of a commercial board. The forty-space perimeter preserves the original authored names and stable `VN-S00`–`VN-S39` identities. Native full details carry readability; miniature lettering is an overview, never the only source of information.

The composition has one visual hierarchy: four attached seat summaries, one neighborhood, one current decision and one dock identifying the actor. The floating cream decision surface uses the same border, materials and shadow as the dock. Focused choices retain the board beside or above them; do not navigate away to a financial dashboard. Table mode introduces the next moment with an illustrated neighborhood card. History and the complete space list are temporary drawers/dialogs.

Historical evidence from [EA's 2010 announcement](https://news.ea.com/press-releases/press-releases-details/2010/EA-to-Deliver-Dynamic-3D-MONOPOLY-Gameplay-Experience-with-MONOPOLY-Streets/default.aspx) supports considering a changing city metaphor, not adopting its art. [Ubisoft's accessibility interview](https://news.ubisoft.com/it-it/article/6KBIQNPgqtAQWeyvX7UTPI/monopoly-accessibility-spotlight) describes optional physical interactions. Our recommendation is a restrained fixed view and native direct controls. See [research distinctions](RESEARCH.md) for limitations and the two further references.

## Tokens and materials

| Role | Token / treatment | Application |
| --- | --- | --- |
| Ink | `#263f35` | Names, outcomes, readable detail text; never encode a seat by color alone. |
| Table | `#f7f1db` → `#e5e3ce`, low-opacity grid | Ambient linen/paper ground. No texture download. |
| Paper | `#fffaf0` | Decisions, dock, dialogs and active seat. |
| Action | `#285c46`, light text `#fff8e6` | Primary commitment. Dark bottom edge implies a tactile button. |
| Muted | `#657064` | Supporting descriptions; critical amounts remain ink. |
| Timber / line | `#c78338` / `#dbd6c4` | Active seat and material edges. |
| Consequence | `#9c4233` | Explicit debt/destructive review, paired with words. |
| Seat 1 | `#b75c45`, flower shape, name | An / Bông hoa. |
| Seat 2 | `#347b79`, kite shape, name | Bình / Cánh diều. |
| Seat 3 | `#7a6991`, paired-leaf shape, name | Chi / Lá non. |
| Seat 4 | `#9b7828`, sailboat shape, name | Dũng / Thuyền buồm. |
| Shape | 18px decision, 16px dock, 14px seat, 10px button | Consistent, gently rounded paper pieces. |
| Elevation | 1px warm border + 4px material edge + soft 14–35px shadow | Decisions and dock above floor; no glass or neon. |
| Spacing | 4 / 8 / 12 / 16 / 20 / 24 / 32px | Dense summaries, generous primary target spacing. |

Typography uses installed `ui-rounded`, SF Pro Rounded, Segoe UI or system sans-serif; Georgia/system serif supplies warm headings. No remote or bundled font. Heading scale 27–29px, property name 18px, cash 21–22px, action 12–14px, readable property table 13px. Small 8–11px ambient labels do not hold unique legal information; the complete 13px native list/details remains reachable. Future production should increase critical copy toward 16px where space permits and verify fluent-reader readability; no family typography approval is claimed.

Primary native controls are at least 44 CSS px high, with a 3px rust focus ring offset 4px. Muted, hover, pressed, focus and disabled states must remain distinguishable without motion. Target WCAG AA text contrast (4.5:1 ordinary text, 3:1 large text) and 3:1 control boundaries/focus; final contrast and assistive-technology acceptance remain required production gates. Do not imply the decorative grass, roof or group swatches individually satisfy text contrast. Display disabled actions with text explaining why (e.g. waiting for sync or another person).

## Board art and framing

Original SVG/code geometry is authored in [mock.js](../../../design/game-ui/mock.js). Floor projection is `x' = 173 + .97x − .17y`, `y' = 65 + .115x + .65y`; the camera never rotates. Buildings rise upright above projected tile anchors. Roof fronts, side faces, awnings, windows, planted shadows and rounded canopies establish depth without a 3D runtime. The inner square has quiet circulation paths rather than control cards scattered over it. The muted green floor gives warm roofs and colored pieces clear separation.

Perimeter cells use eight authored group accents, a space number, short visual name and price where appropriate. Details preserve full Vietnamese names, state, ownership, buildings, mortgage status and rent schedule. The miniature SVG is explicitly decorative (`aria-hidden`); native “Xem đủ 40 ô” opens a navigable list of forty unique identified spaces. Each list control opens full information. Do not require precision taps on tiny perspective tiles. Four distinct token silhouettes repeat in the connected HUD with name and cash. Ownership is a lower edge marker in the purchase storyboard, paired with an accepted-state text summary.

## Component contract

| Component | Idle / decision | Accepted / recovery |
| --- | --- | --- |
| Seat HUD | Name, piece, cash, property count, turn marker. Person holding device is separately named in dock. | Update only accepted snapshot; distinguish eliminated from waiting. No hidden hand information. |
| Dock | Actor, current consequence, one primary next action. Handoff names the recipient explicitly. | Announce result, then enable next legal step. Uncertain result retains last decision and locks new commits. |
| Property deed | Illustrated local shop, full name, group + text, price, current/after cash, rent, buy/decline. | Ownership marker + textual result. Full rent/mortgage/build schedule remains in native detail. |
| Auction | Property, leading bid/seat, responsible bidder, cash limit, handoff, bid input, pass. No timer. | Show accepted bid and next bidder; settle only from authoritative result. Insufficient bid stays editable with reason. |
| Trade | Both parties, both directions, cash/property/building/mortgage state and obligations. | Recipient explicitly receives device before accept/reject; rejected/stale offer keeps context. |
| Debt | Creditor, due, cash, shortfall, legal liquidation choices and consequences. | Confirm sales/mortgages before debt settlement. No silent bankruptcy or automatic winner during acquisition. |
| Setup | Table behind names and pieces; 2–4 seats; deliberate start. | New match/reset requires explicit replacement confirmation in production; mock changes ephemeral labels only. |
| Victory | Authoritative winner, all seats and final holdings, inspectable history, optional celebration. | No automatic restart or deletion. Owner can review results first. |
| Recovery | Last table, pending action, sync state, named actor; commitments disabled. | Read server snapshot/result, reconcile, request handoff again. Retry original command rather than inventing another. |

Mock fixtures include the named eight compositions; dialogs demonstrate inspection, history, mortgage review, liquidation, bankruptcy consequences and retry explanation. Jail, card, shortage and acquisition designs below are documented contracts, not claims of interactive game completeness.

## Full-match surfaces reserved for later stories

Cards reveal only published card text and the accepted effect, with payment/movement summary and continue/skip. Jail uses a compact dock decision that distinguishes visiting from held, remaining attempts, current cash, release-card availability and valid choices; forced movement names its cause. A building-shortage surface identifies stock, competing requests and current bidder/handoff without replacing the board. Acquisition shows the recipient, each encumbered property and required mortgage decision/cost before advancing. Portfolios list full names, group, owner, houses/hotel, mortgage and eligible actions; building purchase/sale includes stock and legal constraints supplied by the engine. These designs preserve existing AC-11–32 and AC-33–38. They introduce no new amounts, eligibility rules or auction ordering.

## Responsive composition

| Review viewport | Composition and behavior |
| --- | --- |
| 1440×900 | Four horizontal HUDs; broad board left; approximately 330px decision on right; dock attached below board. Board, summaries and primary decision fit together. |
| 1280×720 | Compact header and scene; decision scrolls internally if needed; primary dock wraps into its own action row. Preserve board overview. |
| 1024×768 | Same landscape hierarchy with about 300px decision; no normal page scroll for table/purchase/auction target. Full details may scroll in dialog. |
| 768×1024 portrait | Four compact HUDs; board above dock; full-width bounded decision sheet below; its content scrolls internally. |
| 360×800 portrait | Four small identifiable seat cards; board overview first; full-width dock and decision; bounded internally scrolling decision sheet and no forced rotation. |
| 200% zoom | Container width triggers compact/portrait hierarchy. Page and dialogs may scroll vertically. Never hide a legal action to preserve artwork size. |

Container queries use actual preview width rather than host-window width. Review presets constrain the preview frame; the toolbar and notes remain visibly separate from the proposed game. A narrow host clamps a wider requested preset and explains this limitation; use actual browser dimensions for acceptance captures. The preset is not a device emulator.

## Motion, audio and accessibility

Motion is bounded and short: mock dice 650ms before the selected result, optional celebration 800ms. “Hiện kết quả ngay” skips; `prefers-reduced-motion` goes directly to result. Motion is presentation, never an outcome source or a control lock. The mock uses no free camera. Future turn motion should retain the same shallow overview or bounded framing and preserve accepted destination regardless of skip/reload.

Audio starts off every preview load. The explicit sound button enables only short original synthesized effects and toggles persistent-in-view mute; no music, downloaded audio or critical sound-only event. No sound/storage preference is persisted by this mock. All outcomes have equivalent text.

Use semantic native buttons, fields, headings and dialog, natural tab order, visible focus, live status for outcomes and focus restoration after dialog close. Keep Vietnamese diacritics, do not rely on color alone, do not hide board details behind hover. At 200% zoom and reduced motion, all decisions stay reachable. A screen-reader pass, actual touch-device pass, fluent-reader pass and family observations remain open B-09 gates. The implemented mock is a visual proposal and bounded storyboard, not a rules-complete game or accessibility certification.
