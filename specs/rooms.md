# Private multiplayer rooms

## Lifecycle and membership

A host creates a private Lobby and receives a seat credential and shareable opaque invite. Guests choose a display name. The lobby exposes readiness and connection state. Start requires the host and 2–4 connected ready seats. Start pins the board and rules profile, freezes membership, invalidates invites and transitions to InMatch. Completion transitions to Finished. The host can close a lobby before start. Room closure, retention and cleanup timing are deployment decisions before broader testing.

An invite grants admission to the lobby only. A separate server-issued session credential binds identity to one seat. Keep credentials out of logs and gameplay projections. Refresh restores the seat from its session. Use explicit invalid, full and started responses without exposing room state to nonmembers. Capacity and start are serialized with joins.

## Commands and reconnect

Each command contains an ID, expected revision, type and payload. Derive actor from the session. Scope deduplication by room and seat, check it before the revision guard, return the original result for identical retries, and reject reuse with a different payload. Serialize command validation, state write, dedupe receipt and event publication record. Publish after persistence. A stale client receives a resync instruction and submits any new intent explicitly.

On reconnect send the latest authorized snapshot with revision. Clients discard already applied events and resync on gaps. Projections show public game state and own private details only. Unrevealed deck order, credentials and internal random state stay server-side.

The prototype holds seats and pending decisions during disconnects. It resumes when the relevant player returns. Hosts have lobby controls only. Automatic moves, host succession and abandonment policy require a later decision.
