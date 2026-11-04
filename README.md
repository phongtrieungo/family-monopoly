# family-monopoly

Specification-first project for a private, Vietnam-themed family property-trading game on desktop and mobile browsers.

- [GAME-SPEC-001 and prototype scope](specs/GAME-SPEC-001.md)
- [Rules verification registry](specs/rules.md)
- [Implementation backlog and test strategy](specs/backlog.md)

This repository contains design documents, acceptance scenarios and a domain test harness. The official Vietnamese edition is unverified.

## Development

With Node.js 24 or later and npm, run the harness from the repository root.

```sh
npm test
```

The harness has zero package dependencies. It checks fresh synthetic fixture state and scripted dice for AC-04 (purchase) and AC-06 (rent). The Gherkin scenarios are acceptance contracts for the later reducer and application. See [ADR-005](specs/adr/README.md#adr-005--nodejs-domain-harness) for the stack decision.
