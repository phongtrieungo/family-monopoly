# EPIC-004 · Wider-playtest and hosting readiness

**Status:** Deferred proposal. The owner prioritizes [EPIC-002 local presentation](EPIC-002.md); scope and timing for a wider or remote playtest must be selected separately. This plan authorizes no deployment or distribution.

## Outcome

Make an explicit, evidence-backed decision about whether and how to invite more families to play. If the chosen audience needs access across households, prepare a suitable service and data lifecycle before opening it to them. Carry forward the findings in the [B-09 review](../playtest-review.md); an internal browser pass is not physical-device, accessibility, legal or production approval.

## Proposed slices

These are candidates, not assigned backlog items. Each requires an approved audience, scope and owner before implementation; select one slice at a time. Internal review work may proceed without a hosting decision.

| Slice | Story | Acceptance evidence |
| --- | --- | --- |
| S1 · Audience and review plan | As the owner, I can decide who will participate and what is being evaluated. | Record intended participants, devices, duration, access method, responsibilities and feedback handling. Assign reviewers for the existing B-09 branding/distribution, fluent Vietnamese, accessibility, physical-device and balance gates. Record the decision and unresolved work without claiming external approval. |
| S2 · Real-world game review | As a family, we can understand and complete the game on our devices. | Record complete 2-, 3- and 4-player sessions, with profile version, duration, confusion points and consented feedback. Review Vietnamese copy, keyboard, screen reader, reduced motion, zoom, contrast and touch on named real devices. Log results and fix or explicitly defer issues; preserve source provenance and scenario IDs. |
| S3 · Retention and abandonment | As a player and operator, I can understand what happens to paused games and stored data. | The owner chooses and documents a lifecycle for room records, seat sessions, receipts, event history, temporary files and backups, plus who can end abandoned matches and how pending decisions are treated. Translate approved decisions into digital policies and scenarios; implement and test cleanup/recovery only after the policy is selected. Avoid promising deletion before it exists. |
| S4 · Deployment design | As an operator, I can assess a concrete proposed deployment. | If remote access is selected, document a threat model, environment, access and secret handling, HTTPS, invite and session protection, rate limits, persistence/serialization, failure recovery, monitoring, backups and deletion. Select a fit-for-purpose store and write an ADR with explicit limits. No deployment is performed in this slice. |
| S5 · Operational implementation | As an operator, I can run and recover the selected service within the agreed limits. | Implement only the approved design. Test concurrent room writes, committed event/receipt atomicity, publish failures, unauthorized projections, backup/restore and the approved lifecycle. Exercise configuration, failure and rollback procedures without storing credentials in shared evidence. If the chosen design remains single-process, document and verify that limitation. |
| S6 · Controlled playtest decision | As the owner, I can decide whether a defined audience may play. | Assemble reviewer sign-offs, resolved/deferred findings, accessibility and device evidence, rules/content provenance, operational checks, support and rollback plans. Record remaining risks and an explicit go/no-go decision for a named scope. Any actual publication, deployment or invitations require the applicable authorization. |

## Invariants and non-goals

Deterministic server authority, actor and revision validation, idempotent retries, pinned content, reconnect and visibility boundaries remain mandatory. No new game rules, public matchmaking, accounts, payments or broad distribution are implied. Branding and distribution reviews must identify the actual audience and rights scope; internal original content is not a claim of official-edition clearance. B-09 remains open until the relevant human reviews and decisions are recorded.

## Decisions needed to start

Choose whether this epic is a local wider playtest, an invite-only remote pilot, or another scope; identify the participants and operator; decide the applicable review and release gates. Infrastructure, retention periods, abandonment behavior and legal conclusions remain undecided until the owner and appropriate reviewers make those choices.
