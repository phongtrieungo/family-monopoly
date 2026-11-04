# family-monopoly

Specification-first project for a private, Vietnam-themed family property-trading game on desktop and mobile browsers.

- [GAME-SPEC-001 and prototype scope](specs/GAME-SPEC-001.md)
- [Rules verification registry](specs/rules.md)
- [Implementation backlog and test strategy](specs/backlog.md)

This repository contains design documents, acceptance scenarios and a synthetic property-turn reducer with a domain test harness. The official Vietnamese edition is unverified.

## Development

With Bun 1.4.4, run the harness from the repository root.

```sh
bun test
```

The harness has zero package dependencies. It exercises AC-04 (purchase) and AC-06 (rent) through the reducer with scripted dice, and checks invalid boards and illegal transitions. The Gherkin files remain the acceptance contracts. See [ADR-005](specs/adr/README.md#adr-005--bun-domain-harness) for the stack decision.
