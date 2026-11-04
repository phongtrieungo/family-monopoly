# Implementation backlog and verification

The prototype path runs B-01 through B-06. The B-01 harness and fixtures are documented in [ADR-005](adr/README.md#adr-005--bun-domain-harness). Evidence and clearance work can proceed independently.

| ID | Slice | Depends on | Exit criteria |
| --- | --- | --- | --- |
| B-01 | Choose stack and scaffold domain test harness | — | Record stack ADR, development commands and seeded fixtures. |
| B-02 | Board validation and property turn reducer | B-01 | AC-04 and AC-06 pass against fixed dice. Invalid boards and illegal transitions fail. |
| B-03 | Auction reducer | B-02 | AC-05 passes. Cover ties, passes, insufficient funds and single settlement. |
| B-04 | Lobby, revisions and reconnect | B-01 | AC-01–03 and AC-07–09 pass. Race, session and redaction checks pass. |
| B-05 | Responsive Vietnamese-first client | B-02–04 | AC-10 passes at desktop and phone sizes. Include focus and connection-state checks. |
| B-06 | Two-device internal prototype | B-05 | Complete GAME-SPEC-001 prototype acceptance with reproducible fixtures and evidence. |
| B-07 | Edition research and content review | — | Pin edition and evidence for R-01–09, resolve discrepancies, and record asset decisions. |
| B-08 | Full-match rule coverage | B-06, B-07 | Add approved rules and Gherkin for jail, cards, trading, debt, bankruptcy and winner. |
| B-09 | Wider playtest gate | B-08 | Review branding, localization, accessibility, retention and match-abandonment policy. |

## Test strategy

- Domain unit tests use seeded inputs and scripted dice. Assert transitions, movement wrapping, ownership uniqueness, cash/ledger invariants and replay equivalence. Add boundary fixtures as rule rows are verified.
- Integration tests drive actual room commands against the intended persistence layer. Race join/start and competing bids. Inject lost responses and publish failures. Check that reconnect, dedupe and unauthorized projections preserve revision consistency and visibility.
- Browser tests use independent contexts. Verify invitation, purchase, auction, rent, reconnect, keyboard and touch across desktop and mobile viewports. Manually review reduced motion, focus order, Vietnamese copy and announced state changes.
- Specification checks validate local links, unique IDs, traceability and Gherkin syntax. Keep source evidence and licensing review separate from application test outcomes.
