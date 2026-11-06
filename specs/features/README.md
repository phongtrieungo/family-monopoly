# Feature specifications and acceptance contracts

| Feature | Requirement | Story and coverage |
| --- | --- | --- |
| F-01 Private rooms | Members join through a lobby invite. Only a ready host with a ready group can start. | US-01, US-02 · [rooms](rooms.feature) |
| F-02 Property turn | The active seat can roll, purchase or decline, pay affordable rent and end the turn. Auction commands are limited to eligible seats. | US-03, US-04 · [turn](turn.feature) · R-02 to R-04 |
| F-03 Reconnect and authorization | Refresh preserves identity and prompts. Retries and unauthorized commands preserve consistent state. | US-05 · [recovery](recovery.feature) |
| F-04 Accessible board | Keyboard and touch expose the same actions and equivalent board information. | US-06 · [interface](interface.feature) |
| F-05 Full match | Add selected C1009 procedures and the authored profile's jail, deck effects, debt, development, trading, bankruptcy and victory behavior. | US-07 · R-05 to R-09 · [full-match contracts](full-match.feature) · [backlog](../backlog.md) |
| F-07 Renderer comparison | Compare server-driven Phaser and React/SVG presentation in an isolated synthetic spike. | ST-201 · [renderer spike](renderer-spike.feature) · AC-39–40 |
| F-06 Shared-browser local play | One device hosts 2–4 seats in the authored full match. | US-08 · [local play](local-play.feature) · AC-33–38 |

AC-01–10 describe the synthetic prototype. AC-11 onward describe the internal vn-original-v1 profile. AC-11–32 have domain and room coverage recorded in the [B-08 traceability map](../full-match-implementation.md). Shared-browser full-profile coverage is recorded in [B-10 local play](../local-play.md); physical-device and wider playtest review remain open.
