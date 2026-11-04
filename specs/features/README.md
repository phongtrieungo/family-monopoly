# Feature specifications and acceptance contracts

| Feature | Requirement | Story and coverage |
| --- | --- | --- |
| F-01 Private rooms | Members join through a lobby invite. Only a ready host with a ready group can start. | US-01, US-02 · [rooms](rooms.feature) |
| F-02 Property turn | The active seat can roll, purchase or decline, pay affordable rent and end the turn. Auction commands are limited to eligible seats. | US-03, US-04 · [turn](turn.feature) · R-02 to R-04 |
| F-03 Reconnect and authorization | Refresh preserves identity and prompts. Retries and unauthorized commands preserve consistent state. | US-05 · [recovery](recovery.feature) |
| F-04 Accessible board | Keyboard and touch expose the same actions and equivalent board information. | US-06 · [interface](interface.feature) |
| F-05 Full match | Add edition-backed jail, deck effects, debt, development, trading, bankruptcy and winner detection after the vertical slice. | US-07 · R-05 to R-09 · [backlog](../backlog.md) |

Gherkin scenarios describe expected behavior for a synthetic prototype profile. They are acceptance contracts for future automation.
