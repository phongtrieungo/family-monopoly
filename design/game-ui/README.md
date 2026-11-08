# Phố Nhà Mình · ST-501 design proposal

**Internal interactive illustration; UI approved by the owner on 2026-11-08. ST-501 complete.** This is the authorized research/design/mockup slice of [EPIC-005](../../specs/epics/EPIC-005.md), not the playable ST-502 migration. No game API, storage, server transaction, dependency, external font or downloaded asset is used. All amounts, ownership, stock and bidding are explicitly sample snapshots. Existing production UI stays unchanged.

From the repository root, one command starts a static localhost preview:

```sh
python3 -m http.server 4175 --bind 127.0.0.1 --directory design/game-ui
```

Open [the local preview](http://127.0.0.1:4175). Only the three local HTML/CSS/JS files are needed after loading; the page does not contact a server for gameplay. Stop the server with Ctrl+C. Direct `index.html` opening also works because the script uses no modules or fetch, though localhost is preferred for browser review.

Review links can select a scene and frame, for example [desktop purchase](http://127.0.0.1:4175/?scene=purchase&viewport=1280x720) or [phone auction](http://127.0.0.1:4175/?scene=auction&viewport=360x800). These parameters only initialize the design-review controls; unknown values use the default view.

The dark **DUYỆT THIẾT KẾ** toolbar is outside the game proposal. “Cảnh mẫu” switches eight compositions; “Khung xem” constrains preview width/height using container queries. A wider requested frame clamps to a narrow browser and says so. Presets do not emulate touch, zoom, network, browser chrome or hardware. For acceptance, resize the actual browser to the requested dimensions and use “Theo cửa sổ”. The game frame itself is bounded; long decision content scrolls inside its paper sheet. At extreme zoom/small height, vertical page scrolling remains available to reach everything.

## Screen inventory

| Toolbar scene | Review it for | Try |
| --- | --- | --- |
| Bàn chơi | One neighborhood, all four seat identities, turn owner vs device holder, connected dock. | Receive device → roll. Dice result is selected; Skip is available during the short motion. |
| Mua đất | Illustrated deed, price, rent, before/after cash, board present. | Full details, buy, decline to auction. Buying changes only the mock ownership marker and sample HUD. |
| Đấu giá | Leader/amount, bidder handoff, available cash and both bid/pass controls. | Receive as Bình; edit bid, +10/+50, send or pass. Each accepted sample decision changes the visible bidder. |
| Chuẩn bị | Names and tokens on the same table. | Edit names and enter sample table. Four-seat illustration is fixed; blank optional names become sample guests, not a real 2–4-seat engine. |
| Trao đổi | Explicit two-way offer, recipient and handoff. | Receive as Bình, accept/reject; result explains no real asset transfer. Fixed offer, no editor. |
| Khoản nợ | Debtor, creditor, total, current cash and shortfall. | Review/confirm sample mortgage, inspect liquidation and bankruptcy consequences. No real settlement. |
| Kết thúc | Winner, all seats, optional celebration and deliberate new setup. | Celebrate, Skip celebration, or inspect setup. No reset of a real session. |
| Khôi phục | Last board, retained purchase, locked actions and retry explanation. | Simulate reconnect → receive as An → same purchase. No actual reconnect or command retry. |

“Xem đủ 40 ô” opens all full names and IDs, then native property schedules and special-space descriptions. “Diễn biến” is explicitly a static sample timeline. The audio button starts off; enabling it permits only a short original synthesized effect. Mute remains available throughout this preview visit; reload resets preferences. Tiny board labels are decorative overview; use native details for full reading.

## Storyboard to click

1. Select **Bàn chơi**. An is turn owner, but the dock asks who holds the device.
2. **Tôi là An · nhận máy** opens the roll prompt. Roll sample 1+2 or use **Hiện kết quả ngay** during its 650ms motion. The token starts at position 38 for this chosen result.
3. The landing is **Ngõ hoa Hà Nội**, position 1 after wrapping. The purchase deed keeps the neighborhood behind/beside it.
4. Inspect full details or choose **Mua khu đất · 80 xu**. The sample has 1,040 xu before and 960 xu after.
5. The ownership result names An, marks the property and updates the sample HUD. These are ephemeral review changes.
6. **Kết thúc lượt · đến Bình** requests another explicit handoff.
7. **Tôi là Bình · xem lượt thuê mẫu** illustrates the payer/recipient and 4 xu rent. **Xem lại câu chuyện** resets the mock scene.

Declining purchase instead opens the auction fixture. The mock's three-pass result is a selected storyboard ending, not a new auction rule or rules-complete simulation. Reload discards all demonstration state.

## Review checklist and viewport matrix

Owner visual approval must explicitly cover the table, purchase and auction compositions plus setup, trade/debt, victory and tablet/phone behavior. Do not mark ST-501 Done or start ST-502 based only on automated checks.

| Actual viewport | Required scenes | Look closely at |
| --- | --- | --- |
| 1440×900 | Table, purchase, auction | A single table; dimensional original neighborhood; four identifiable tokens; connected HUDs/dock; action and summaries in frame. |
| 1280×720 | Table, purchase, auction, bidder received | Art retains height; decision scrolls internally; primary and decline/pass stay together. |
| 1024×768 | Table, purchase, auction | Board overview, readable summaries, complete primary decision; no ordinary horizontal/page overflow. |
| 768×1024 | Table, purchase, auction, setup | Board overview above a bounded internally scrolling sheet; dock remains reachable. |
| 360×800 | All eight | No sideways scrolling, board overview retained; decision actions reachable inside sheet, no forced rotation. |
| 200% browser zoom | Table, purchase, auction, property dialog | Responsive reading order, all fields/actions reachable, close/back and visible focus retained. |
| Reduced motion | Roll, victory | Result appears directly; no required animation; text and choices equivalent. |

Keyboard: Tab from toolbar into sound/history, the 40-space control, dock and decision. Confirm the rust focus ring. Use Enter/Space to activate native controls; open details, Tab through controls, Escape to close, and verify focus returns to opener. Native modal dialogs constrain focus. In a long decision, Tab should bring every bid/input/primary/pass control into view. Status messages supplement a persistent result; they are not the only copy of a material decision.

Touch: use the browser touch mode first, then a physical tablet/phone in a later B-09 review. Tap 44px primary controls, the full-space list and dialog close/back; scroll the decision sheet independently of the board. Avoid testing only miniature tiles, which are explicitly a noninteractive illustrated overview.

Use 200% browser zoom and the OS/browser reduced-motion preference. Sound must remain silent until explicitly enabled; disable it again. Test a non-numeric/out-of-budget auction bid and verify the error keeps the input/context. Check that the requester/recipient and cash consequence are visible before commitment.

## Contracts, evidence and open gates

Run the focused pure rendering regressions with `node design/game-ui/verify-mock.cjs` from the repository root, and syntax-check with `node --check design/game-ui/mock.js`. These checks use an in-memory DOM stand-in; they cover fixture output, participant identity, recipient handoff, safe names and reduced-motion branching, not browser layout or assistive technology.

- [DESIGN.md](../../specs/design/game-ui/DESIGN.md): visual tokens, components, board geometry and responsive contract.
- [EXPERIENCE.md](../../specs/design/game-ui/EXPERIENCE.md): setup-to-finish flow, actor/event/recovery boundaries, full-match surface contracts and existing acceptance mapping.
- [RESEARCH.md](../../specs/design/game-ui/RESEARCH.md): four primary references, historical/marketing distinctions and original-art decisions.
- [Implementation spec / Verification Evidence](../../_bmad-output/implementation-artifacts/spec-st-501-game-ui-visual-contract.md#verification-evidence): exact checks, tested digest, parent captures and limitations.
- [Sources](../../specs/research/sources.md) and [licensing](../../specs/research/licensing.md): reference-only sources and project-authored provenance.

Structural checks do not establish visual approval or full accessibility. Parent owns actual browser matrix/captures. Physical-device, screen-reader, fluent-reader, family, branding, distribution and all existing [B-09](../../specs/playtest-review.md) gates remain open. EPIC-002 stays completed with optional retrospective; ST-502–505 remain backlog until separately authorized.
