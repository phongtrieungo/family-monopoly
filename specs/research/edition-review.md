# B-07 edition and content review

## Selected rules baseline

Codex reviewed SRC-01 on 2026-11-06. The selected baseline is Hasbro C1009, English, document 101C100900, copyright 2016, layout dated 2017-02-15. Page numbers below are one-based PDF pages. The product page lists 2–8 players while the rulebook cover lists 2–6. Preserve the document identity when selecting a profile.

The rulebook was retrieved from the publisher's Malaysia English instructions page. The New Zealand download exposes the same document identifier and layout date. Neither establishes a Vietnamese edition. The research retained source links and locators.

[Malaysia rulebook](https://instructions.hasbro.com/api/download/C1009_en-my_monopoly-classic-game.pdf) · [New Zealand rulebook](https://instructions.hasbro.com/api/download/C1009_en-nz_monopoly-classic-game.pdf)

## Rule locators and implementation gaps

| Rule | SRC-01 locator | Prototype gap or review action |
| --- | --- | --- |
| R-01 | p. 2, SET IT UP! and Who goes first? | Prototype gives 100 xu and starts with the host. |
| R-02 | p. 2, On your turn and GO | Prototype omits doubles and salary. |
| R-03 | p. 1, Auctions | Candidate opening offer is 10. Prototype accepts 1. DP-02 and DP-03 specify passing and spending. AC-05 covers the provisional implementation. |
| R-04 | p. 2, Owned Streets, Railroads, Utilities and rent warning | Automatic rent differs from the candidate's claim deadline. AC-06 covers affordable synthetic rent. |
| R-05 | p. 2, Chance / Community Chest and taxes | Original decks and amounts are recorded in the content profile. |
| R-06 | p. 2, Go To Jail and How do I get out of Jail? | Jail scenarios remain B-08 work. |
| R-07 | p. 1, Buildings, Deals & Trades and Mortgaging Property | Add approved transitions and economy data in B-08. |
| R-08 | p. 1, HELP! I CAN'T PAY! | Add creditor-specific settlement and victory scenarios in B-08. |
| R-09 | p. 2, Free Parking and Just Visiting; p. 1, TOP TIPS | Review full-board effects before introducing them. |

## Content and policy gates

The owner selected Hasbro Classic C1009 with an original Vietnamese theme and translated UI on 2026-11-06. The researched document above defines the selected rules baseline. The current implementation still uses the synthetic profile.

A Vietnamese boxed edition is no longer required for this direction. SRC-03 stays unverified as a historical research lead. SRC-04 remains a retail lead.

The owner authorized original economy and cards on 2026-11-06. The [original content profile](content-profile.md) defines the full board, street values, decks and DP-01–10. Codex selected automatic rent collection, final auction passing and paused unrelated auction actions under the instruction to proceed. Those choices are digital policies.

B-07 has an authored content baseline. The [shortage research](#building-shortage-research) resolves the development procedures through publisher evidence and explicit digital policies. No full C1009 board or deck dataset has been claimed as verified. B-08 must implement the selected procedures with the authored content and pass its scenarios before the profile is selectable. Fluent-reader review, playtest balance and public distribution review remain open. See the [licensing manifest](licensing.md).

## Building shortage research

Codex reviewed Vietnamese explanations SRC-05 and SRC-06 on 2026-11-06. Both support auctions under competing building demand. They lack an edition identifier. MBMart also describes service rent using the arrival roll and contains a jail fee that conflicts with SRC-01. Those passages are excluded from this profile.

SRC-07 is a publisher FAQ covering insufficient houses during hotel sales. It clarifies that even group liquidation can proceed using available stock. This corrects the earlier suggestion that every hotel downgrade must simply be blocked. It is supplemental evidence without an exact C1009 edition pin.

The [content profile](content-profile.md#building-shortage-procedure) specifies the application. DP-09 collects explicit competing demand before the last token is sold. DP-10 defines atomic stock accounting and refund interpretation for the original economy. Mixed-development and two-street cases are authored generalizations of the FAQ example. AC-24–27 make these decisions reviewable before implementation.
