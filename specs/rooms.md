# Private multiplayer rooms

## Lifecycle and membership

A host creates a private Lobby and receives a seat credential and shareable opaque invite. Guests choose a display name. The lobby exposes readiness and connection state. Start requires the host and 2–4 connected ready seats. Start pins the board and rules profile, freezes membership, invalidates invites and transitions to InMatch. Completion transitions to Finished. The host can close a lobby before start. Room closure, retention and cleanup timing are deployment decisions before broader testing.

An invite grants admission to the lobby only. A separate server-issued session credential binds identity to one seat. Keep credentials out of logs and gameplay projections. Refresh restores the seat from its session. Use explicit invalid, full, closed and started responses without exposing room state to nonmembers. Capacity and start are serialized with joins.

## Commands and reconnect

Each command contains an ID, expected revision, type and payload. Derive actor from the session. Scope deduplication by room and seat, check it before the revision guard, return the original result for identical retries, and reject reuse with a different payload. Serialize command validation, state write, dedupe receipt and event publication record. Publish after persistence. A stale client receives a resync instruction and submits any new intent explicitly.

On reconnect send the latest authorized snapshot with revision. Clients discard already applied events and resync on gaps. Projections show public game state and own private details only. Unrevealed deck order, credentials and internal random state stay server-side.

The prototype holds seats and pending decisions during disconnects. It resumes when the relevant player returns. Hosts have lobby controls only. Automatic moves, host succession and abandonment policy require a later decision.

## B-04 server boundary

The prototype service runs in one process with synchronous room transactions. Its local file store atomically replaces the room records, command receipts and revisioned event history together. Keep the store in a private server directory. Use one process per store file. Browser transport, multi-process storage, and retention remain open.

Creation returns the invite and host session. Joining returns a separate guest session. Reconnect returns the caller's seat ID and latest snapshot. A connection change advances the revision only when the connected flag changes. A transport adapter is responsible for tracking live connections and calling disconnect when a seat's last connection closes.

The service accepts revisioned Ready, Start and Close commands in the lobby. In a match it routes turn commands through the property reducer with the authenticated actor and server-supplied dice. The synthetic match starts with the host, equal configured cash, and all properties at the bank. The service exposes committed events after a supplied revision so a transport can resume delivery after a missed response. Start and join races resolve in commit order. A join that commits before Start changes the revision and requires the host to resync.
