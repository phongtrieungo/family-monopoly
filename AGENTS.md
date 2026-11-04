# Agent instructions

- Start with [GAME-SPEC-001](specs/GAME-SPEC-001.md), then read the linked domain spec, ADRs and backlog item before changing anything.
- The current phase is specification only. Gameplay, dependencies, production infrastructure and asset imports require a subsequent implementation request.
- Implement future work one backlog slice at a time. Preserve stable requirement, rule and scenario IDs. Update the specification and scenarios alongside any approved behavior change.
- Treat unverified rules and provisional choices as such in code, tests and UI. Verify rule evidence by exact edition and locator before promotion. Keep digital policies separate from tabletop rules.
- Keep the engine deterministic and server authoritative. Validate actor and state revision, make retries idempotent, and verify reconnect and visibility behavior.
- Use original or cleared content only. Record provenance and review in the research manifests before importing or distributing third-party material.
- Before handoff, check links, diff whitespace and scenario traceability. Once runners exist, run the tests for the slice and report commands, outcomes and open gates.
