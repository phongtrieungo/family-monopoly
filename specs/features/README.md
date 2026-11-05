# Feature specifications and acceptance contracts

| Feature | Requirement | Story and coverage |
| --- | --- | --- |
| F-01 Private rooms | Members join through a lobby invite. Only a ready host with a ready group can start. | US-01, US-02 · [rooms](rooms.feature) |
| F-02 Property turn | The active seat can roll, purchase or decline, pay affordable rent and end the turn. Auction commands are limited to eligible seats. | US-03, US-04 · [turn](turn.feature) · R-02 to R-04 |
| F-03 Reconnect and authorization | Refresh preserves identity and prompts. Retries and unauthorized commands preserve consistent state. | US-05 · [recovery](recovery.feature) |
| F-04 Accessible board | Keyboard and touch expose the same actions and equivalent board information. | US-06 · [interface](interface.feature) |
| F-05 Full match | Add selected C1009 procedures and the authored profile's jail, deck effects, debt, development, trading, bankruptcy and victory behavior. | US-07 · R-05 to R-09 · [full-match contracts](full-match.feature) · [backlog](../backlog.md) |

AC-01–10 describe the synthetic prototype. AC-11 onward describe the future vn-original-v1 profile. They are acceptance contracts for future automation.
