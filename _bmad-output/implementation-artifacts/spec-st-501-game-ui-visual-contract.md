---
title: 'ST-501: cohesive game UI visual contract and mockups'
type: 'feature'
created: '2026-11-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '4d49a04544ca9a98c0f40acc90fe66b72977766e'
context:
  - /Users/ngotrieuphong/Projects/ai-repos/family-monopoly/specs/epics/EPIC-005.md
---

<frozen-after-approval reason="owner approved the redesign plan and requested implementation; visual approval remains a later gate">

## Intent

The local game embeds Phaser inside disconnected webpage panels. Deliver a concrete, high-fidelity design proposal that establishes one game table before changing production UI. Create the approved EPIC-005 research/design/mockup slice, not the later playable implementation.

## Boundaries & Constraints

Scope: design contracts and isolated interactive mock; high visual ambiguity, moderate impact. Preserve EPIC-002 completion, game source, rules, sessions and scenario IDs. No new dependency, external font/CDN, imported commercial imagery, deployment, commit or push. Original SVG/CSS/code art is appropriate; do not invoke image generation for assets better expressed as vectors. Mock text is Vietnamese; design documentation is English. Fixture amounts are illustrative, explicitly labeled and never promoted as new economy rules.

Confirmed choices: warm Vietnamese illustrated 2.5D neighborhood; shared desktop/tablet first, usable 360px phone; fixed shallow oblique board, short skippable motion; optional effects only, deliberate enablement and mute, no music. One table with HUD, contextual dock and overlays; native accessible HTML remains part of the eventual Phaser projection. Mockup approval precedes ST-502. Document that approval is pending; do not mark ST-501 Done.

</frozen-after-approval>

## Code Map

- `src/web/local.html`, `src/web/style.css`: disconnected current layout; read for diagnosis, leave unchanged.
- `src/web/local-board.js`: current square renderer, read only. Future production remains Phaser 3.90/HTML under ADR-007.
- `src/domain/vn-original-content.js`: authored names and current values; reuse labels for mock fixtures without copying commercial content.
- `specs/research/{sources,licensing}.md`: append original mock provenance and reference sources; no third-party artwork import.
- `specs/backlog.md`, `specs/ui-ux.md`, sprint tracker: add EPIC-005/ST-501 pointers without reopening EPIC-002 or authorizing later slices.

## Tasks & Acceptance

- [x] `specs/design/game-ui/{DESIGN,EXPERIENCE,RESEARCH}.md`: concrete visual tokens, materials, typography, component states, layouts, journeys, event/recovery/actor boundaries, responsive and accessibility contract; cite the four researched primary references below, distinguishing historical evidence, publisher claims and our recommendations. Contracts must cover setup through victory, including inspection, auctions, trade, debt, jail, shortage/acquisition and recovery.
- [x] `design/game-ui/index.html`, `design/game-ui/style.css`, `design/game-ui/mock.js`: self-contained high-fidelity proposal. Original illustrated 40-space shallow-oblique table, dimensional neighborhood buildings/trees, four identifiable tokens, connected player HUDs and action dock. A design-review toolbar switches table, purchase, auction, setup, trade, debt, victory and recovery fixtures plus viewport presets. These controls must be clearly outside the product design. Show internal/demonstration labeling; no game APIs or storage mutations. Avoid a form dashboard or simple colored-box wireframe. Board remains visually present behind focused decisions. Use inspectable native buttons, visible keyboard focus, readable full property details and 44px primary targets. Fixture interactions must either visibly respond or be explicitly identified as static illustration; no deceptive game controls.
- [x] `design/game-ui/README.md`: one-command localhost preview instructions, screen inventory, storyboard (handoff→roll→landing→purchase→ownership→next player→rent), review checklist and pending owner gate. Provide keyboard/touch and narrow-layout review instructions.
- [x] `specs/epics/EPIC-005.md`, `specs/backlog.md`, `specs/ui-ux.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`: track ST-501 in progress/awaiting visual approval and ST-502–505 backlog only; retain the optional EPIC-002 retrospective and all B-09 gates. Add B-18 for ST-501. Do not mark a human review passed.
- [x] Research manifests: add reference-only URLs and original SVG/CSS provenance.

Acceptance criteria:
- Given the mock opens locally offline, when selecting each named fixture, then its distinct composition appears over a consistent table with no server request or genuine transaction.
- Given desktop/landscape sizes 1440×900, 1280×720, 1024×768, when inspecting table/purchase/auction, then board, summaries and decision are composed within the viewport; portrait 768×1024 and 360×800 retain a board overview above a decision sheet without horizontal overflow.
- Given keyboard/reduced motion/200% zoom, when navigating fixture controls and decisions, then focus remains visible and content stays reachable; motion can be skipped and audio is silent until explicitly enabled.
- Given delivered artifacts, when handed off, then owner can review actual visuals and the scope remains ST-501 awaiting visual approval rather than an implemented production game.

## Design Notes

First-party references, retrieved in this conversation on 2026-11-08: EA's 2010 Monopoly Streets press release (news.ea.com/press-releases/press-releases-details/2010/EA-to-Deliver-Dynamic-3D-MONOPOLY-Gameplay-Experience-with-MONOPOLY-Streets/default.aspx); Ubisoft's 2024 Monopoly Accessibility Spotlight (news.ubisoft.com/it-it/article/6KBIQNPgqtAQWeyvX7UTPI/monopoly-accessibility-spotlight); Marmalade's game page (www.marmaladegamestudio.com/games/monopoly); designer Caroline Henriksen's 2022 front-end redesign case study (www.carolinechenriksen.com/monopoly-front-end-redesign). Recheck only as needed to accurately quote/cite; no claims of hands-on testing or current feature parity. Do not claim inaccessible gameplay images were visually inspected. Derive our original art direction from the user's selections.

## Verification

Implementer owns focused syntax/structural checks, local Markdown link targets, 40 unique spaces, complete fixture coverage and diff whitespace. Use `node --check design/game-ui/mock.js`; validate file references, SVG IDs, no remote asset dependencies or game API access with a small meaningful inspection script if useful. No new app tests for isolated design artifacts. Record exact commands/output and tested digest in Verification Evidence. Parent owns browser visual checks through CUA after implementation, with actual desktop and narrow screenshots; never fabricate capture/measurement results. Full production game/browser suites are not required when application code stays unchanged. Record remaining physical-device, screen-reader, fluent-reader and family gates.

## Implementation Notes

- Approved conversational plan supplied implementation authorization; no duplicate plan-approval request was introduced. ST-501 is the single current slice; the mockup-first owner gate remains open before production work.
- Original code-authored SVG/CSS mock, eight fixtures and review-only deep links. Root completed tracking/manifests and focused regression checks after the implementation agent hit its usage limit; source artifacts were preserved.
- `review_risk: medium`: bounded prototype controls and future UX contracts; authoritative game code unchanged. Correctness and verification-gap layers ran in isolated contexts; edge-case layer skipped under policy. Follow-up checks resolved all filed findings. No new full review was required for the small patches.
- Browser inspection caught collapsed illustration height, clipped paired actions and unbounded phone decisions. Patched flex shrinking, sticky action footer and fixed-frame internal sheet scrolling. Fixture switching also resets sheet scroll.
- Eight pure rendering/interaction regressions cover unique board/list output, all fixture headings, actor changes, edited names/escaping, recipient handoff and reduced-motion branching. They do not stand in for browser, physical-device or assistive-technology tests.
- No production UI/reducer/room/session changes, dependency additions, commit or push. Story remains in review rather than following generic workflow finalization to Done because the approved story explicitly requires owner visual approval.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence / resolution |
| --- | --- | --- |
| CR-1 HUD turn owner remains An in next/rent | medium | Verified `i === 0` markers conflicted with dock. Marker and accessible owner label now derive from storyboard stage; regression and reviewer recheck pass. |
| CR-2 trade decline before recipient receives device | medium | Verified enabled control/unguarded handler. Both responses render only after handoff and handler enforces stage; direct pre-handoff rejection regression passes. |
| CR-3 edited names differ from hardcoded participants | medium | Verified setup mutates seats while downstream copy retained defaults. All fixture participant, leader, history/detail names derive from seats and remain HTML escaped; regression/recheck pass. |
| VG-other-1 HUD identity inconsistency | medium | Same demonstrated root as CR-1; grouped for one patch, retained as its own finding record. |
| VG-other-2 edited participant labels | medium | Same demonstrated root as CR-3; grouped for one patch, retained as its own finding record. |

Both reviewers reported no remaining findings on scoped patch recheck. No verification-gap finding was filed; all original findings were verified as reachable before fixing. No deferred code findings. Owner visual and manual acceptance gates remain separate.

## Verification Evidence

Working directory: repository root. Tested state is HEAD `4d49a04544ca9a98c0f40acc90fe66b72977766e` plus SHA-256 `fad4c5ac97aa6f6c2d1d7a4ecfb19686423818962dfdaf28b4a7fe102d5267eb`. Reproduce by sorting unique paths from `git ls-files -co --exclude-standard -z`, and hashing UTF-8 path + NUL + file bytes + NUL for each existing file. Exclude only this status/evidence spec and `_bmad-output/implementation-artifacts/st-501-verification.log`. All mock, regression, contract, research, tracking and baseline files are inputs. Runtime ledger/cache data is ignored by Git.

Environment: macOS; Node v22.22.3; Python 3.15.2; native Google Chrome via CUA (browser version not captured). [Inspectable command output and browser/review limitations](st-501-verification.log).

| Command / check | Tested state | Outcome / coverage | Evidence |
| --- | --- | --- | --- |
| `node --check design/game-ui/mock.js` | Digest above; code unchanged since run | Exit 0; JavaScript syntax valid | Verification log |
| `node design/game-ui/verify-mock.cjs` | Same executable content | Exit 0; 8 passed, 0 skipped. Eight fixture headings, 40 unique board/list IDs, review links, turn owner, trade handoff, edited/escaped names, reduced-motion branch | Verification log; both reviewer patch rechecks |
| `uv run .agents/skills/bmad-sprint-planning/scripts/sprint_plan.py validate --status-file _bmad-output/implementation-artifacts/sprint-status.yaml` | Final tracker and digest above | Exit 0; valid, no problems/legacy statuses. Rechecked after status and shared story-location updates | Verification log and final tool output |
| Local Markdown/HTML/asset/whitespace inspection; `git diff --check` | Same implementation; excluded evidence only updated afterwards | 62 local Markdown file targets exist; unique static HTML IDs; all eight selectors; local asset references; no game-network/storage calls or remote stylesheet assets; final newlines/no trailing whitespace in all 17 changed/new files | Verification log and inspection output |
| Native Chrome CUA visual spot-checks | Final layout CSS; sample scene labels; selected frame presets | Actual captures: 1440×900 table, 1280×720 table/purchase/auction, 1024×768 purchase, 768×1024 purchase, 360×800 auction before/after handoff. Corrected art sizing, paired sticky actions and bounded phone sheet observed. These are preset container reviews, not actual resized-browser or physical-device acceptance. | CUA screenshots in this conversation; reproducible localhost preview; no PNG/video export claimed |
| Native interaction/keyboard inspection | Same layout/interaction structure | Buy visibly updated fixture HUD/result; auction handoff revealed input and bid/pass; 40-space dialog and property detail showed full names/rent/build/mortgage information; Tab reached back action and Escape closed/restored available heading focus | CUA accessibility trees/screenshots |
| `git diff --name-only -- src test specs/features` | Digest above | Empty; production UI/game, application tests and scenario contracts unchanged. Existing IDs preserved; AC-04/06/11–32/33–38 mapped in EXPERIENCE.md, not claimed as newly executed gameplay tests | Verification log |

Open gates: owner visual approval before ST-502; full actual-browser viewport/scene matrix, actual 200% zoom, complete Tab traversal, OS reduced-motion browser integration and audio playback audit remain unrun. Physical touch, screen-reader, fluent-reader, family, branding and distribution reviews remain open under B-09. Mock checks do not close those gates. Production suites were not run because production code is unchanged. Story remains `in-review`, not Done. Current-turn runtime model/token hook evidence is unavailable; configured model routing is not telemetry.

## Owner approval and PR delivery · 2026-11-08

The owner explicitly stated “Approve the UI. Create PR”. This closes the ST-501 visual approval gate, supersedes the earlier pending-status/no-commit/no-push delivery boundaries, and authorizes the commit, push and PR. The historical frozen contract, implementation notes and verification evidence above describe the pre-approval state. ST-501 is now Done; EPIC-005 remains in progress and ST-502–505 remain backlog. No application code changed after the recorded checks; only approval/status documentation changed. Remaining actual-browser matrix, accessibility, audio and B-09 manual checks are still open and are not inferred from visual approval.
