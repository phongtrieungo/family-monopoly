# Implementation backlog and verification

The prototype path runs B-01 through B-06. The B-01 harness and fixtures are documented in [ADR-005](adr/README.md#adr-005--bun-domain-harness). Evidence and clearance work can proceed independently.

| ID | Slice | Depends on | Exit criteria |
| --- | --- | --- | --- |
| B-01 | Choose stack and scaffold domain test harness | — | Record stack ADR, development commands and seeded fixtures. |
| B-02 | Board validation and property turn reducer | B-01 | AC-04 and AC-06 pass against fixed dice. Invalid boards and illegal transitions fail. |
| B-03 | Auction reducer | B-02 | AC-05 passes. Cover ties, passes, insufficient funds and single settlement. |
| B-04 | Lobby, revisions and reconnect | B-01 | AC-01–03 and AC-07–09 pass. Race, session and redaction checks pass. |
| B-05 | Responsive Vietnamese-first client | B-02–04 | AC-10 passes at desktop and phone sizes. Include focus and connection-state checks. |
| B-06 | Two-device internal prototype | B-05 | Complete GAME-SPEC-001 prototype acceptance with [reproducible fixtures and evidence](prototype-acceptance.md). |
| B-07 | Edition research and content review | — | Pin edition and evidence for R-01–09, resolve discrepancies, and record asset decisions. Content baseline and shortage procedures recorded in the [B-07 review](research/edition-review.md) and [original content profile](research/content-profile.md). Wider-review gates remain open. |
| B-08 | Full-match rule coverage | B-06, B-07 | Approved rules and Gherkin for jail, cards, trading, debt, bankruptcy and winner are implemented in the domain and room service. See [B-08 coverage and open client gates](full-match-implementation.md). |
| B-09 | Wider playtest gate | B-08, B-10 | Review branding, localization, accessibility, retention and match-abandonment policy. See [B-09 findings and open gates](playtest-review.md). |
| B-10 | Shared-browser local play | B-08 | AC-33–38 pass for 2–4 seats on one machine, authored full-match controls, handoff, refresh and command retry. See [local-play contract](local-play.md). |
| B-11 | ST-201 visual direction and renderer spike | B-08, B-10 | Compare Phaser and React/SVG on the same server-accepted input, verify accessible and reduced-motion presentation, capture evidence and document the renderer decision. The owner selected Phaser plus native HTML; see [ADR-007](adr/ADR-007-renderer-proposal.md). See [ST-201](epics/EPIC-002-stories.md#st-201--visual-direction-and-renderer-spike). |
| B-12 | ST-202 game table and setup | B-08, B-10, B-11 | Render the authoritative 40-space local match with Phaser and the equivalent HTML space list; retain setup, separate seat credentials, handoffs and saved-session recovery. Check 2–4 names, desktop/360px layout and keyboard/touch access. See [ST-202](epics/EPIC-002-stories.md#st-202--game-table-and-setup). |
| B-13 | ST-203 turn and landing presentation | B-12 | Present accepted dice, server-derived movement, landing and contextual choices; refresh/skip/reduced motion reconcile to the same snapshot. Cover AC-04, AC-06, AC-17, AC-29, AC-33–34, AC-36 and AC-38 without changing reducer rules. See [ST-203](epics/EPIC-002-stories.md#st-203--turn-and-landing). |
| B-14 | ST-204 cards, payments and auctions | B-13 | Present accepted card reveals and payment feedback, and explicit shared-device auction decisions. Preserve visibility, idempotency, recovery and server settlement; cover AC-12–15, AC-18, AC-22, AC-35–36 and AC-38. See [ST-204](epics/EPIC-002-stories.md#st-204--cards-payments-and-auctions) and the [implementation story](../_bmad-output/implementation-artifacts/2-204-cards-payments-and-auctions.md). |
| B-15 | ST-205 manage, trade and recover | B-14 | Present editable trade review, mortgage consequences, debt context and recoverable decisions. Preserve authoritative settlement, actor handoffs and pending context; focused and full local browser acceptance, 68 tests and web build pass. See [ST-205](epics/EPIC-002-stories.md#st-205--manage-trade-and-recover) and the [implementation story](../_bmad-output/implementation-artifacts/spec-st-205-manage-trade-recover.md). |

The owner prioritized B-10 after B-08 and before the B-09 review. Backlog IDs remain stable.

## Test strategy

- Domain unit tests use seeded inputs and scripted dice. Assert transitions, movement wrapping, ownership uniqueness, cash/ledger invariants and replay equivalence. Add boundary fixtures as rule rows are verified.
- Integration tests drive actual room commands against the intended persistence layer. Race join/start and competing bids. Inject lost responses and publish failures. Check that reconnect, dedupe and unauthorized projections preserve revision consistency and visibility.
- Browser tests use independent contexts. Verify invitation, purchase, auction, rent, reconnect, keyboard and touch across desktop and mobile viewports. Manually review reduced motion, focus order, Vietnamese copy and announced state changes.
- Specification checks validate local links, unique IDs, traceability and Gherkin syntax. Keep source evidence and licensing review separate from application test outcomes.

## Proposed future epics

The owner selected ST-201 as B-11 and ST-202 as B-12 on 2026-11-06. ST-202 is complete following owner manual validation; its automated handoff runner remains a known harness limitation. The owner selected ST-203 as B-13 on 2026-11-06; focused desktop and 360px browser acceptance passed on 2026-11-06. ST-204 is selected as B-14 and complete; focused and full browser acceptance passed in its isolated worktree. ST-205 was selected as B-15 and completed on 2026-11-07 after focused and full browser acceptance, 68 tests and the web build passed. ST-206 remains proposed. Existing requirement IDs remain stable.

- [EPIC-002: Local family game presentation](epics/EPIC-002.md) — highest priority; see [detailed stories and status](epics/EPIC-002-stories.md).
- [EPIC-003: Private full-match play across devices](epics/EPIC-003.md) — deferred until after the local experience.
- [EPIC-004: Wider-playtest and hosting readiness](epics/EPIC-004.md) — deferred and subject to audience and deployment decisions.
