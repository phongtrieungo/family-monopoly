# family-monopoly

Specification-first project for a private, Vietnam-themed family property-trading game on desktop and mobile browsers.

- [GAME-SPEC-001 and prototype scope](specs/GAME-SPEC-001.md)
- [Rules verification registry](specs/rules.md)
- [Implementation backlog and test strategy](specs/backlog.md)

This repository contains design documents, acceptance scenarios and Vietnamese-first browser clients for the authored local full match and the synthetic online prototype. The official Vietnamese edition is unverified.

Run the prototype with Bun 1.4.4.

```sh
bun install --frozen-lockfile
bun run start
```

For **2–4 people sharing one machine**, open [local play](http://127.0.0.1:3000/local), enter names and start the full authored game. Confirm the named player at each handoff; choose bidders explicitly in auctions. Reload the same tab to resume.

For the original online synthetic prototype, open [private rooms](http://127.0.0.1:3000), create a room, then open its invite link in a separate browser profile or private window. The local server uses a temporary room store by default. Set `ROOM_STORE` to a file in a private directory to reuse that store after a restart.

## Development

With Bun 1.4.4, build the local Phaser bundle and run the harness from the repository root.

```sh
bun run build:web
bun test
```

The domain harness itself uses Bun's runner and has no runtime dependency; the local presentation pins Phaser 3.90.0 for the board canvas and keeps its HTML equivalent. The harness exercises AC-04 (purchase) and AC-06 (rent) through the reducer with scripted dice, and checks invalid boards and illegal transitions. The authored full-match domain and room service also cover AC-11–32. The private-room adapter uses the synthetic profile; the local page uses the authored full profile. See the [B-08 command contract, traceability and open client gates](specs/full-match-implementation.md). The Gherkin files remain the acceptance contracts. See [ADR-005](specs/adr/README.md#adr-005--bun-domain-harness) for the stack decision.

Local-play behavior and browser verification are recorded in the [B-10 contract](specs/local-play.md). The default temporary store lasts for the server process; use `ROOM_STORE` in a private directory to keep games across server restarts.
