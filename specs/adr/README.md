# Architecture decision records

These records establish prototype boundaries. ADR-005 selects the domain harness stack. Hosting remains open.

## ADR-001 · Deterministic domain engine

**Context.** Dice, decks and interacting effects must be reproducible across clients and test runs.

**Decision.** Use a framework-independent command reducer with injected randomness and time inputs. Pin immutable board/rules versions. Persist random outcomes or equivalent replay inputs with the accepted event.

**Consequences.** Replays and unit tests can reproduce effects. Changing a board or rule profile requires a version bump. A client-owned engine would allow divergent outcomes.

## ADR-002 · Authoritative room and durable revisions

**Context.** Players can act concurrently and refresh during decisions.

**Decision.** Serialize writes per room and atomically persist state, revision, dedupe receipt and publish record. Use request/response commands and a server event stream, with a fresh snapshot on reconnect or a gap.

**Consequences.** Clients share one committed history and delivery can retry. The implementation must test publish failures and prevent later revisions from being overwritten. Full event sourcing is deferred because snapshots plus accepted events meet prototype needs.

## ADR-003 · Guest seats and invite boundary

**Context.** Families need low-friction access across devices with no public discovery.

**Decision.** Use opaque lobby invites and separate seat sessions. Require room membership to read snapshots and seat authorization for commands.

**Consequences.** Refresh can resume a seat. Lost session recovery across devices is deferred. Invite sharing grants entry until invalidation, so join attempts need rate limiting.

## ADR-004 · Responsive browser and separate content

**Context.** Desktop and mobile must share one rules surface with Vietnamese-first copy.

**Decision.** Ship one responsive browser client. Separate localized copy, visual assets and rule/board data. Use neutral branding and original presentation for the prototype.

**Consequences.** Both device classes require browser acceptance coverage. Content updates are reviewable independently, and verified rules can be introduced through explicit profile versioning.

## ADR-005 · Bun domain harness

**Status.** Accepted for B-01.

**Context.** The first implementation slice needs a reproducible command to exercise deterministic fixtures before the board and reducer exist.

**Decision.** Use Bun 1.4.4 and native JavaScript ES modules. Use the built-in `bun:test` runner and assertions. Keep domain modules independent of runtime-specific APIs so they can be exercised without a room server and shared with browser tooling where useful. Start with fresh synthetic fixture state and scripted dice pairs. The authoritative server will supply live randomness when the reducer is integrated.

**Consequences.** The harness requires Bun, with zero package dependencies and no build step. Use explicit validation for inputs at domain boundaries. A compile-time type system was considered and deferred for this slice. Select the web framework, persistence, transport implementation and hosting when the corresponding backlog items need them.

## ADR-006 · Shared browser, separate seat sessions

**Context.** Local play requires several people to share one browser while retaining the authoritative room and rules engine.

**Decision.** Atomically create a local original-profile match and return a bundle of separate seat sessions to that browser. Store the bundle in session storage. Authenticate commands using the selected seat session and the existing revision/receipt boundary. Treat the shared device as one connection lease. Add a dedicated local page with handoffs and explicit auction actors.

**Consequences.** People at the same device can control any local seat. This is a trusted shared-screen mode. Sessions and unrevealed deck order remain absent from public projections. Existing online admission and synthetic browser flows keep their current boundary. See the [local-play contract](../local-play.md).
