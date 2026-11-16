# EPIC-007 · Table effects, sound and music

**Status:** Planned. The owner requested AI-assisted visual effects, sound effects and background music. The initial scope is the shared-browser Phaser table from [EPIC-006](EPIC-006.md).

## Outcome

The table gives brief, readable feedback for dice, movement, cards, transactions and victory. Players can opt into quiet instrumental music and adjust it independently from event sounds. The board, current decision and accepted outcome stay readable throughout play.

## Repository research and decisions

Sources reviewed 2026-11-15. Repository and provider terms should be checked again for the exact revision, account and output at production time.

| Candidate | Finding and use |
| --- | --- |
| OpenAI Game Studio sprite pipeline | Official agent skill for normalizing 2D sprites from an approved frame. Use its transparency, stable alignment and whole-strip workflow if original drawn textures are needed. Use native Phaser geometry for rings, paths and simple particles. [Sprite pipeline](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/sprite-pipeline/SKILL.md) |
| ElevenLabs Agent Skills | Official `sound-effects` and `music` skills document separate generation workflows and use a developer API key. First candidate for one-shot effects and offline soundtrack drafts. Use only the selected skill, pinned to a reviewed revision. [Skills repository](https://github.com/elevenlabs/skills) · [Sound effects quickstart](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/sound-effects) |
| ElevenLabs MCP | Official alternative interface if already connected. The skills provide a smaller integration surface for the planned offline workflow. [MCP repository](https://github.com/elevenlabs/elevenlabs-mcp) |
| Google Lyria RealTime | Official streaming music generation alternative. An offline capture may be evaluated if the first provider is unsuitable and output rights are confirmed. The game needs one edited local loop, so no live generation session is planned. [Lyria RealTime API](https://ai.google.dev/gemini-api/docs/realtime-music-generation) |
| Phaser examples and versioned API | Reference for 3.90-compatible emitter behavior, renderer selection and sound playback with browser audio unlock. Sample assets remain reference material. [Examples repository](https://github.com/phaserjs/examples) · [3.90 ParticleEmitter](https://docs.phaser.io/api-documentation/3.90.0/class/gameobjects-particles-particleemitter) · [Phaser audio](https://docs.phaser.io/phaser/concepts/audio) |

Asset generation is an authoring step. Bundle reviewed output as locally served assets. Keep provider clients and credentials out of the game, test harness and deployment. Use original procedural effects and synthesized one-shots if generated assets fail review. For music, use a project-authored or individually cleared loop if provider terms or output quality are unsuitable.

The repository's code license and the rights to distribute generated media have separate evidence. Check attribution, game-use eligibility, edits, and whether the intended public repository and browser delivery would expose isolated audio files. Record allowed scope in the [licensing manifest](../research/licensing.md). Use original prompts that describe materials, musical characteristics and mood without naming an artist or asking for an existing track. [ElevenLabs creative terms](https://elevenlabs.io/creative-terms) · [ElevenLabs music terms](https://elevenlabs.io/music-terms)

## Cue map

Initial durations and budgets below are targets to validate in ST-701. All displayed amounts and action results come from accepted state or events.

| Trigger | Phaser treatment | Sound |
| --- | --- | --- |
| Accepted player roll | Brief dice accent on the existing dice view. Use the accepted faces. | Dry wooden dice rattle, once per roll. |
| Cell arrival and final landing | Use ST-603's movement lifecycle. Optional small contact mark on steps and a ring on the final cell. | Quiet wooden tap, at most once per 120 ms. Use a distinct short landing tap. |
| Direct transfer or failed jail roll | Static destination or jail marker. No street-by-street travel for a transfer and no steps when the token stays put. | A quiet direct-transfer cue where supported. |
| Accepted card reveal | Brief paper edge accent inside the card area. | Card slide. |
| Purchase and payment | Outline the affected property or seat and show the already-confirmed amount. Distinguish received from paid through text and icon. | Soft stamp for purchase. One restrained coin cue for a payment sequence. |
| Auction settlement and building | Highlight the accepted lot/winner or building space. An auction with no bid gets quiet text feedback. | Wooden knock on settlement or build. |
| Confirmed winner | Optional bounded celebration on the existing finish screen. | Short fanfare on deliberate celebration. |
| Active match | Stable board, existing action area. | One quiet instrumental loop on opt-in. No new track on turn handoff. |

## Implementation stories

### ST-701 · Prove the visual and audio direction

**Dependencies:** Read the Epic 6 layout, motion and settings contracts. This story can run against labeled fixtures before its production cutover.

- Produce a small independent playback fixture with accepted dice and landing, purchase/payment, and a finish sample. Compare native Phaser rings and emitters with a transparent raster accent only where it materially improves the art. Verify Canvas and WebGL parity at Epic 6’s target desktop sizes with active overlays.
- Prepare an audition set of six to eight one-shots. Example prompts include two small wooden dice rattling once on felt, a single thick card sliding on paper, and one or two muted coins on a wooden tray. Compare at matched perceived volume.
- Audition one 60–90-second instrumental loop, warm and spacious with sparse plucked strings, light wood percussion and a steady tempo around 75–90 BPM. Keep the melody and mix quiet enough for conversation. Assess the repeat boundary and whether the loop still feels comfortable after ten minutes.
- Record chosen treatments, asset IDs, prompts, provider and skill revision, model and generation date, output checksums, edits, usage rights and allowed distribution. Keep unreviewed drafts outside served assets.

**Exit:** A reviewable cue sheet and audition fixture, a rights disposition for each proposed asset path, and a demonstrated Canvas fallback. Establish the motion and mix defaults for the implementation stories.

### ST-702 · Route accepted events to presentation cues

**Dependencies:** ST-603 and ST-616 from Epic 6, plus ST-701. Use the final Epic 6 scene/controller entry points after cutover.

- In the existing local sync path, consume ordered, newly accepted rows after applying the authoritative snapshot. Give event cues a stable key from match scope, revision, event index and cue type. Source movement contact cues from the accepted movement renderer, using the route segment and step index. Generate no gameplay events or commands from cue callbacks.
- Treat initial load, reload, resync and skipped historical rows as static reconciliation. Silence stale one-shots when several revisions arrive after a gap. Cancel queued movement cues on Skip, route supersession and scene teardown. Cap repeated event sounds within a burst, retaining the textual outcome.
- In unit tests, inject ordered fixtures into the cue mapping and assert stable keys and triggers. In HTTP-path fixtures, assert one cue per accepted event across a lost response and retry, silence on resync, and identical server revisions with all cues enabled or disabled.

**Exit:** Tested cue mapping for roll, movement, card, transaction, auction/build and finish, including duplicate, gap and cancellation cases.

### ST-703 · Build Phaser board effects

**Dependencies:** ST-702 and the reviewed ST-701 visual treatment.

- Implement the dice accent, movement contacts, landing highlight and property/seat feedback in a Phaser effect layer anchored to the board or on-canvas component. Reuse existing token positioning and card/decision overlays. Recompute anchors on layout changes or clear transient effects that are no longer relevant.
- Use bounded graphics/tweens and short-lived particle bursts. Start with a maximum of 24 concurrent particles and 600 ms for routine pulses. Keep effects behind actionable text and use input-transparent objects. Reduced motion replaces travel accents, pulses and particles with a stable outline or icon. Skip clears active motion-associated effects immediately.
- Reuse or destroy objects, listeners and tweens at scene teardown and restart. Keep the existing victory control and its deliberate start/stop behavior. Suppress repetitive whole-board flashes, shakes and full-screen effects.

**Exit:** Browser captures for the cue map on Canvas and WebGL, with desktop mouse input, reduced motion, repeated restarts and a rapid accepted-event fixture. Verify the active controls remain hit-testable and no stale effects survive refresh.

### ST-704 · Package and play sound effects

**Dependencies:** ST-701, ST-702 and Epic 6's audio settings surface from ST-605.

- Trim reviewed one-shots to remove silence, use short fades, match apparent loudness and keep clean source masters according to their rights disposition. Encode locally for browsers using Ogg and MP3 alternatives where rights allow. Record sizes and validate decodes on target browsers. Start with a 350 KiB total encoded SFX transfer budget for one selected format.
- Use one playback owner. Consolidate the current `playEffect()` path into the Epic 6 audio controller or its successor. Use Phaser sound playback if the ST-701 fixture confirms the required unlock, volume and mute behavior. Limit concurrent effects to three, prioritize landing and accepted decision cues over repetitive step sounds, and stop queued sounds on mute or cancellation.
- Default SFX off. Unlock from an explicit tap or keyboard activation, provide independent SFX volume and persist the preference with defensive defaults. Handle unsupported, missing and failed assets quietly. Keep accepted text and screen-reader announcements usable with all audio off.

**Exit:** Verify unlock via mouse and keyboard, each selected cue, rapid volume/mute changes, duplicate recovery, missing media, and no unsolicited sound on reload. Check that a muted match makes no audio requests until enabled.

### ST-705 · Add the background loop

**Dependencies:** ST-701 for cleared music and ST-704 for playback and settings.

- Edit at a musically natural boundary, with compatible phrasing and a short tail crossfade where needed. Verify the actual encoded file repeats cleanly in the target desktop browsers. Use one local track for an active match and budget up to 1.5 MiB per selected codec. Fetch only after opt-in.
- Add separate Music on/off and volume canvas controls. Remember choices without starting music on page load before browser unlock. After opt-in, pause when the page is hidden, stop on finish or match replacement, and resume only if the match is active, visible and still opted in. A failed load or late decode cannot start after mute, navigation or replacement. Keep one music instance across actor changes and decision overlays.
- Preview starting relative gains of music 0.15 and effects 0.45 on a 0–1 scale, then adjust using the audition fixture. Use short fades for start and stop when supported. Gameplay and awaiting-turn status work with no soundtrack.

**Exit:** Listen across three consecutive loop boundaries in the target desktop browsers. Verify independent controls, stored preferences, page hide/restore, blocked autoplay, missing audio, finish and restart without layered tracks.

### ST-706 · Verify full-match presentation and asset delivery

**Dependencies:** ST-703–705 and Epic 6 cutover.

- Drive the existing local HTTP path with representative two- and four-seat fixtures. Cover a roll and card move, payment, auction handoff, building, recovery and confirmed finish. Run desktop mouse and keyboard, forced Canvas and normal renderer selection. Compare accepted outcomes and revision traces with effects and music on versus off.
- Check transfer sizes, decoding, listener cleanup, reduced motion, no cue replay on refresh or duplicate response, and stable scene state after repeated restart. Verify all media can be served locally with correct content types and without contacting generation providers. The current server serves an explicit asset set in [server.js](../../src/web/server.js). Add an explicit media mapping or constrained manifest lookup as needed.
- Record asset provenance and notices, codec/browser results, a short visual capture, the manual audio and accessibility results and applicable B-09 gates. Run `bun test`, `bun run build:web` and the Epic 6 canvas acceptance runner for the tested revision.

**Exit:** AC-47–53 pass with inspectable fixture evidence, audio remains optional, and media artifacts are cleared for the intended distribution.

[Acceptance scenarios](../features/table-effects.feature) · [Wider-playtest gates](../playtest-review.md)

## Playback ownership and lifecycle refinements

ST-702 must receive the movement lifecycle from ST-603. Accepted event arrival may enqueue a landing cue, but the route completion callback releases that cue only for the current route. Skip, hidden-page suspension, reload and supersession discard it. Routine payment cues may be coalesced, so AC-47 guarantees at most one cue per accepted event and exactly one for an eligible isolated event.

Use a match-scoped presentation cursor and a scene generation counter. Advance the cursor while muted or hidden so re-enabling never replays a backlog. A decode promise checks both its request generation and current preferences before creating playback. Scene replacement invalidates callbacks, disconnects listeners and stops owned sounds. Keep music playback owned by the match controller across layout/scene redraws.

ST-704 and ST-705 share these defaults: a new preference record has both channels disabled. Stored preferences restore sliders and switches, while each document requires an explicit user activation to unlock playback. Mute stops active and queued channel audio immediately. On return from a hidden page, resume music only if it was playing, remains enabled and the browser allows playback. Otherwise show the existing Music control ready for activation. Closing an inspection panel never unlocks audio implicitly.

For ST-703 and ST-706, record browser version, device or emulation, viewport, renderer and a repeatable event burst. Compare frame times and retained effect objects with effects disabled, during the burst and after cleanup. Before acceptance set a measured budget for the intended device. Verify repeated restarts return owned emitters, tweens and listeners to the same baseline.
