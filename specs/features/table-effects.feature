Feature: Optional effects and music on the local Phaser table

  @AC-47
  Scenario: Present newly accepted outcomes exactly once
    Given an active local match with visual effects and sound enabled
    When an accepted roll and purchase are followed by a repeated sync or command receipt
    Then each eligible isolated outcome triggers its configured cue once
    And duplicate or coalesced events never trigger extra cues
    And the same confirmed state is reached with effects disabled
    And refresh shows accepted outcomes without replaying historical cues

  @AC-48
  Scenario: Use the table with reduced motion and the Canvas renderer
    Given the local table is running with the Canvas renderer and reduced motion
    When a token lands and the player receives a decision
    Then static position and outcome cues identify what happened
    And the decision remains available by keyboard and mouse

  @AC-49
  Scenario: Keep sounds and music optional and independent
    Given a newly opened game has no audio opt-in
    Then the game plays no audio
    When the player enables music using the canvas control and later mutes sound effects
    Then a single quiet music loop can play while event effects remain muted
    And backgrounding or finishing the match stops audible music
    And a failed or blocked audio load leaves gameplay usable

  @AC-50
  Scenario: Cancel movement feedback when presentation skips to the accepted state
    Given a confirmed multi-cell route is being presented with sound enabled
    When the player skips the route or a newer accepted snapshot supersedes it
    Then the token shows the accepted position
    And queued feedback from the interrupted route stops
    And no gameplay command is issued by the presentation

  @AC-51
  Scenario: Load reviewed media locally
    Given only reviewed assets are listed in the game media manifest
    When the player opts into audio and plays a local match
    Then the game loads playback assets from its own origin
    And no AI generation provider or key is required at runtime

  @AC-52
  Scenario: Discard late audio after the player changes their mind
    Given music is enabled and its asset is still loading
    When the player disables music or replaces the match before decoding completes
    Then the late result starts no playback
    And re-enabling audio plays no queued historical effects

  @AC-53
  Scenario: Align landing feedback with the current route
    Given an accepted route is animating toward a landing
    When the route completes normally
    Then its landing cue occurs at completion
    But when the route is skipped or superseded its queued landing cue is discarded
