# Rubric review

**Verdict: concerns.** The spine captures the principal server-authority, presentation and operational boundaries, but several cross-unit contracts need tightening before it is a dependable implementation substrate.

## High

1. **Recovery versus in-flight commands and retries is unspecified.** AD-6 requires a new session and old-session invalidation, while AD-2 requires durable idempotent receipts. Two compliant implementations can respectively scope receipts to a rotating session or the stable seat, and differ on whether a command issued before recovery can be retried afterward. `specs/rooms.md` explicitly scopes deduplication to room and seat. Make that binding explicit and serialize recovery/session revocation against commands so an already accepted effect cannot be replayed and a revoked session cannot create a new one.
2. **Recovery-code protection is deferred as a whole rather than setting a consistent trust boundary.** AD-6 permits two builders to store codes in plaintext or use weak, guessable codes and to issue them through an unauthenticated channel. Bind a high-entropy secret, secure verification/storage, delivery exclusively to the seat holder, TLS and throttled recovery attempts before remote exposure. Exact algorithms and rate limits may remain deferred. Concurrent recovery should have one well-defined committed session owner.
3. **The future-authored profile dispatch boundary is deferred without an invariant.** The structure mentions explicit server-side dispatch, but independent room and persistence implementers can still use different criteria after restart or silently fall back to synthetic content. Bind persisted version/profile identity to reducer/content dispatch, reject unknown versions, and preserve each existing room's pins.

## Medium

4. **The user-confirmed four-person cap is easy to misread.** Structural seed says the pilot targets four people, while the source rules permit multiple 2–4-person rooms. Clarify whether four is per match or total pilot participants; the user said four people maximum. Avoid presenting it as an enforced global capacity until specified.
5. **Exact retry semantics omit return of the original receipt.** AD-2 says check the receipt but not what the caller receives. Bind identical retry to the original committed result and changed reuse to rejection; this is already settled in `specs/rooms.md`.
6. **A missing durable-event continuity requirement.** AD-2 says commit revisioned events, while AD-3 says fetch snapshot on gaps, but the event publication record, durable handoff after failed publication, and explicit history-retention policy are not distinguished. Bind no uncommitted publication and resumable delivery or explicit snapshot resync when history is unavailable, leaving transport implementation open.
7. **Source of truth ambiguity for new recovery policy.** Recovery codes change the prior project design, where `specs/rooms.md` and ADR-003 explicitly defer lost-session recovery. Mark AD-6 as an approved future direction, not current implemented behavior, and require policy/scenario updates before implementation; reconcile the upstream spec when the authorized slice begins.

## Low

8. **No explicit version claim beyond repository pins.** The Stack links explain fit and current repository pins but do not assert latest, which is appropriate. Preserve that distinction and record verified command/version evidence rather than implying independent online validation of those exact pins.
9. **Content provenance is not binding in the spine.** `AGENTS.md` and existing project specs require original or cleared content and review before distribution; AD-5 addresses localization but not asset provenance. Include this invariant if the spine is intended to govern the whole project, or explicitly cite the binding policy.

The deployment and environment dimension is surfaced with current localhost/temporary-storage limits, single-process constraints, and concrete gates for the future hosting slice. No parent spine is specified, so there is no inherited-AD contradiction to assess.
