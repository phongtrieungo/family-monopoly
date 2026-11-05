# Original Vietnamese full-match content profile

Profile ID `vn-original-v1`. Board ID `vn-neighborhood-v1`. Both have version 1. The owner authorized original Vietnamese economy and cards on 2026-11-06. Codex authored this internal content draft on that date. Its values describe a fictional game economy. Names and copy require fluent-reader and branding review before wider distribution.

Use the C1009 procedures identified in [the edition review](edition-review.md), together with the digital policies below. This profile has original amounts, labels and effects. Keep `synthetic-prototype` available for existing tests and recorded matches. B-08 introduces this profile through explicit selection and version pinning.

## Economy contract

All amounts use integer xu. Start each seat with 1200. Passing or landing on the start space by ordinary forward movement awards 160 once per crossing. Forced jail movement awards zero. The two tax amounts are 120 and 80. The jail release fee is 50, with the selected edition's three exit options and three-attempt procedure. No payout occurs on the rest space. Bank funds have no gameplay limit.

Prices and rent schedules are authored below. Street rent columns mean base, complete undeveloped group, one through four houses, and hotel. The construction column is the per-building cost, including the hotel upgrade. Mortgage proceeds equal half the purchase price. Releasing a mortgage costs its principal plus 10%, rounded up. Sell buildings for half their construction cost. Ordinary hotel sales exchange the hotel for four available houses. For shortages, apply DP-10.

Transit spaces each cost 180. Rent for one, two, three or four transit holdings is 20, 45, 90 or 180. Service spaces each cost 140. Their rents use a separate authoritative dice roll with multiplier 4 for one service holding and 10 for two. Group and ownership counts include mortgaged holdings, but mortgaged property itself earns zero rent.

## Board

Position is zero-based. Space IDs are `VN-S00` through `VN-S39`, independent of names. Groups G1–G8 identify the eight street groups. T identifies the transit holdings and U the services. Copy keys are `vn.space.00` through `vn.space.39`.

| Position | Vietnamese label | Type or group |
| --- | --- | --- |
| 0 | Quảng trường sum vầy | Start |
| 1 | Ngõ hoa Hà Nội | G1 |
| 2 | Chuyện xóm mình | Community deck |
| 3 | Sân nhỏ Hà Nội | G1 |
| 4 | Quỹ hạ tầng | Tax 120 |
| 5 | Bến xe Bắc | T |
| 6 | Phố đèn Hải Phòng | G2 |
| 7 | Bước ngoặt | Chance deck |
| 8 | Chợ sớm Hải Phòng | G2 |
| 9 | Hiên nhà Hải Phòng | G2 |
| 10 | Nhà chờ | Jail or visiting |
| 11 | Vườn nhà Huế | G3 |
| 12 | Trạm điện khu phố | U |
| 13 | Ngõ tím Huế | G3 |
| 14 | Sân vườn Huế | G3 |
| 15 | Bến xe Trung | T |
| 16 | Hiên nắng Đà Nẵng | G4 |
| 17 | Chuyện xóm mình | Community deck |
| 18 | Chợ chiều Đà Nẵng | G4 |
| 19 | Phố gió Đà Nẵng | G4 |
| 20 | Vườn nghỉ | Rest |
| 21 | Đồi hoa Đà Lạt | G5 |
| 22 | Bước ngoặt | Chance deck |
| 23 | Ngõ thông Đà Lạt | G5 |
| 24 | Sân mây Đà Lạt | G5 |
| 25 | Bến xe Cao Nguyên | T |
| 26 | Chợ nổi Cần Thơ | G6 |
| 27 | Ngõ nước Cần Thơ | G6 |
| 28 | Trạm nước khu phố | U |
| 29 | Hiên sông Cần Thơ | G6 |
| 30 | Đến nhà chờ | Go to jail |
| 31 | Phố sáng Sài Gòn | G7 |
| 32 | Ngõ vui Sài Gòn | G7 |
| 33 | Chuyện xóm mình | Community deck |
| 34 | Sân chung Sài Gòn | G7 |
| 35 | Bến xe Nam | T |
| 36 | Bước ngoặt | Chance deck |
| 37 | Vườn biển Phú Quốc | G8 |
| 38 | Phí cảnh quan | Tax 80 |
| 39 | Hiên biển Phú Quốc | G8 |

## Street values

Group ownership requires every street in that group. Theme names imply no real-world price ranking. Follow the selected edition's even-building procedure, with bank stock of 32 houses and 12 hotels. Construction costs and mortgage values below are this profile's authored data.

| Space | Price | Construction | Rent schedule |
| --- | --- | --- | --- |
| VN-S01 | 80 | 40 | 4, 8, 20, 60, 180, 280, 400 |
| VN-S03 | 100 | 40 | 6, 12, 30, 90, 220, 340, 480 |
| VN-S06 | 120 | 60 | 8, 16, 40, 120, 300, 420, 560 |
| VN-S08 | 120 | 60 | 8, 16, 40, 120, 300, 420, 560 |
| VN-S09 | 140 | 60 | 10, 20, 50, 150, 340, 460, 620 |
| VN-S11 | 160 | 80 | 12, 24, 60, 180, 400, 540, 700 |
| VN-S13 | 160 | 80 | 12, 24, 60, 180, 400, 540, 700 |
| VN-S14 | 180 | 80 | 14, 28, 70, 210, 440, 580, 760 |
| VN-S16 | 200 | 100 | 16, 32, 80, 240, 500, 660, 840 |
| VN-S18 | 200 | 100 | 16, 32, 80, 240, 500, 660, 840 |
| VN-S19 | 220 | 100 | 18, 36, 90, 270, 540, 700, 900 |
| VN-S21 | 240 | 120 | 20, 40, 100, 300, 600, 780, 980 |
| VN-S23 | 240 | 120 | 20, 40, 100, 300, 600, 780, 980 |
| VN-S24 | 260 | 120 | 22, 44, 110, 330, 640, 820, 1040 |
| VN-S26 | 280 | 140 | 24, 48, 120, 360, 700, 900, 1120 |
| VN-S27 | 280 | 140 | 24, 48, 120, 360, 700, 900, 1120 |
| VN-S29 | 300 | 140 | 26, 52, 130, 390, 740, 940, 1180 |
| VN-S31 | 320 | 160 | 28, 56, 140, 420, 800, 1020, 1260 |
| VN-S32 | 320 | 160 | 28, 56, 140, 420, 800, 1020, 1260 |
| VN-S34 | 340 | 160 | 30, 60, 150, 450, 840, 1060, 1320 |
| VN-S37 | 360 | 180 | 34, 68, 170, 510, 920, 1160, 1440 |
| VN-S39 | 400 | 180 | 40, 80, 200, 600, 1040, 1300, 1600 |

## Original decks

Each deck contains one of each listed ID, shuffled once with server randomness at match creation. Persist the resulting order server-side. Ordinary cards return to the bottom after resolution. A retained release card leaves its deck until used, traded or disposed of during bankruptcy according to the creditor. It can release its holder at the start of a jailed turn. Bankruptcy to another player transfers retained release cards to that creditor. Bankruptcy to the bank returns them to their own decks. The UI shows retained card identities to all seats while hiding unrevealed deck order.

The following Vietnamese text is original copy. Effects are authoritative. Positive bank transfers credit the drawing seat, and fees debit it. Relative backward movement never awards start money. A forward destination move awards start money only if its route crosses start, then resolves that destination. Moving directly to start awards exactly 160. Movement to jail ends the turn without a start award. Resolve movement and any destination obligation before returning the card.

| ID | Vietnamese copy | Effect |
| --- | --- | --- |
| VN-C01 | Về quảng trường gặp cả nhà. | Move forward to VN-S00 |
| VN-C02 | Ghé vườn nhà Huế. | Move forward to VN-S11 |
| VN-C03 | Hẹn nhau ở sân mây. | Move forward to VN-S24 |
| VN-C04 | Một chuyến đi biển. | Move forward to VN-S39 |
| VN-C05 | Đổi tuyến xe ở bến gần nhất. | Move forward to next T space; ordinary transit landing |
| VN-C06 | Ghé trạm dịch vụ gần nhất. | Move forward to next U space; ordinary service landing |
| VN-C07 | Quay lại tìm chiếc ô. | Move backward three spaces |
| VN-C08 | Chờ xử lý giấy tờ. | Go to jail |
| VN-C09 | Giấy hẹn đã được giải quyết. | Retain release card |
| VN-C10 | Hoàn tất một đơn hàng. | Bank pays 70 |
| VN-C11 | Nhận thưởng ý tưởng mới. | Bank pays 40 |
| VN-C12 | Bán đồ dùng còn tốt. | Bank pays 30 |
| VN-C13 | Chi phí chuyển nhà. | Pay bank 45 |
| VN-C14 | Góp tiền sửa đường. | Pay bank 25 |
| VN-C15 | Bảo trì nhà cửa. | Pay bank 20 per house and 70 per hotel owned |
| VN-C16 | Mời hàng xóm uống trà. | Pay each other solvent seat 15 |
| VN-M01 | Quỹ xóm hoàn lại khoản góp. | Bank pays 90 |
| VN-M02 | Gian hàng cuối tuần có lãi. | Bank pays 60 |
| VN-M03 | Nhận quà từ bạn xa. | Bank pays 35 |
| VN-M04 | Tiết kiệm được một khoản. | Bank pays 25 |
| VN-M05 | Cả xóm mừng sinh nhật bạn. | Collect 10 from each other solvent seat |
| VN-M06 | Về quảng trường dự hội. | Move forward to VN-S00 |
| VN-M07 | Thăm ngõ hoa Hà Nội. | Move forward to VN-S01 |
| VN-M08 | Ghé chợ nổi Cần Thơ. | Move forward to VN-S26 |
| VN-M09 | Chờ xác nhận hồ sơ. | Go to jail |
| VN-M10 | Hồ sơ đã được thông qua. | Retain release card |
| VN-M11 | Mua cây cho sân chung. | Pay bank 20 |
| VN-M12 | Đóng góp thư viện xóm. | Pay bank 30 |
| VN-M13 | Chi phí khám sức khỏe. | Pay bank 55 |
| VN-M14 | Sửa lại mái hiên. | Pay bank 35 per house and 90 per hotel owned |
| VN-M15 | Được hoàn phí sinh hoạt. | Bank pays 45 |
| VN-M16 | Trúng giải hội chợ nhỏ. | Bank pays 15 |

An in-flight card stays outside its deck until its saved continuation finishes. Nested draws keep separate card IDs and return to their own decks. An eliminated drawer's in-flight cards return after bankruptcy settlement.

Repairs count individual houses on streets and hotels separately. A hotel contributes no houses to repair costs. Multi-seat payments process recipients or debtors in current seat order, beginning after the drawing seat and skipping eliminated seats. Save the next recipient and remaining card work during debt resolution. For VN-C16, the current recipient is the creditor if the drawer goes bankrupt. Resolve that creditor's bankruptcy transfer, then cancel gifts still queued to later recipients. Collected gifts from earlier recipients are never reversed. For VN-M05, each debtor's creditor is the drawing seat. After that debtor's bankruptcy transfer, skip it and continue with other queued debtors. Recheck for a winner after all mandatory transfer obligations finish. If only one seat remains, finish the match and cancel future card transfers. A debt paid through liquidation resumes the same saved card exactly once.

## Digital policies

These decisions apply to this original profile. They are project choices for the browser game. C1009 evidence and these choices remain separately identifiable.

| ID | Decision | Acceptance contract |
| --- | --- | --- |
| DP-01 | Automatically assess and collect lawful rent at landing. | The owner receives one ledger entry without submitting a claim. Debt pauses the turn. |
| DP-02 | Property auctions open at 10 xu. Bids increase by at least 1 xu. A voluntary pass is final for that auction. A leader cannot pass. | Settlement occurs once when only the leader remains eligible. If all pass without bidding, the bank retains the deed. |
| DP-03 | During an auction, accept only auction commands and connection recovery. | Bids use existing cash. Trades, building and mortgage commands are rejected until settlement. |
| DP-04 | No decision timers or automatic passes. | Disconnect preserves seat, bid and pending obligation. Resume after reconnect. |
| DP-05 | Round fractional bank charges up to an integer xu. | A mortgage principal of 90 costs 99 to release. A principal of 5 costs 6. |
| DP-06 | Initial order comes from server dice, with tied leaders rerolling until one wins. Keep lobby seat order cyclically after that winner. | Persist setup rolls so replay reconstructs the same first seat. |
| DP-07 | Each original deck has a public retained release card. | Its owner can use or trade it. Other seats cannot inspect unrevealed cards. |
| DP-08 | Resolve multi-seat card transfers and their bankruptcy continuations in the order specified above. | Preserve the current creditor and next recipient across reconnect. Previously settled transfers stay committed. |
| DP-09 | Reserve the last building and collect eligible demand before committing its sale. | Follow the demand round below. Competing demand produces an auction starting at 10 xu. |
| DP-10 | Use an atomic group liquidation when four-house hotel replacement is impossible. | Follow the shortage calculation below using available physical stock and even development. |

When acquiring a mortgaged property by trade or bankruptcy, its new owner chooses immediate release or keeping the mortgage. Immediate release pays principal plus 10%. Keeping it pays 10% immediately and a later release still costs principal plus 10%. Round each charge under DP-05. Save acquisition obligations before allowing unrelated spending.

## Building shortage procedure

SRC-01 p. 1 requires an auction when several players want the final building. SRC-05 and SRC-06 corroborate this in Vietnamese. The following demand round is a digital coordination policy.

When a legal construction request would consume the bank's last house or hotel, reserve that token and pause unrelated game commands. Invite every solvent seat with a legal target and enough cash for an opening bid to register a target or decline. Target validation includes complete ownership, mortgage restrictions, and even development. Require an explicit response from each invited seat, retaining the round across disconnect under DP-04. The original requester registers its target as part of the request.

If only one request remains, offer that seat the normal construction price. An unaffordable offer or refusal releases the reservation without a sale. If multiple requests remain, auction the reserved token starting at 10 xu under DP-02. The winner pays the accepted bid instead of the construction price. Passing is final. If no one bids, return the token to stock. Allocate the building to its winner's registered target and commit payment, stock, and development in one transaction. Revision order serializes commands inside this round.

Hasbro FAQ 68 describes even group dismantling and replacement with available houses when a normal hotel downgrade cannot occur. It supplies a three-hotel example without a C1009 identifier. Apply it explicitly as a supplemental ruling in this authored profile. The generalized accounting below is DP-10, including mixed groups and two-property groups.

The owner submits a group liquidation and its proposed final house counts. Remove all hotels in that group in one transaction. Let H be the group's physical houses before liquidation, B the bank's available houses, and N the number of streets. Keep min(H + B, 4 × N) houses distributed as evenly as possible across the group. The final counts may differ by at most one, with no street above four. The owner chooses which streets receive the higher count.

Return all removed hotels to the bank. For each removed hotel refund half its listed construction fee. Refund half the listed house construction fee for each physical house removed in excess of replacement houses. Do not credit a separate sale of the four houses historically exchanged for a hotel. Adjust bank house stock by H minus the final house total. Validate the target counts and commit all stock, cash and development changes together. The owner may then sell those remaining houses through the ordinary even-sale procedure.

For G3 with three hotels, construction fee 80 and zero bank houses, the result is three bare streets and a refund of 120 xu. With two bank houses, a valid result is one house on VN-S11, one on VN-S13 and none on VN-S14, with the same refund. If the owner remains unable to pay after lawful liquidation, continue the saved debt resolution.

## Implementation handoff

B-08 must specify and test the new state transitions before making this profile selectable. Preserve AC-01–10 as the synthetic acceptance suite. The [full-match scenarios](../features/full-match.feature) cover the authored profile and policy differences. Existing saves must keep their pinned profile and content version.
