@F-06 @vn-original-v1
Feature: Share one browser between local players

  @AC-33
  Scenario: Four people start one authored match without invitations
    Given four distinct display names on the local setup screen
    When the shared browser starts the match
    Then the server atomically creates four separate seats in vn-original-v1
    And no invitation or readiness step is required
    And retrying the same creation request restores the same match and seats

  @AC-34
  Scenario: The next person acknowledges a shared-screen handoff
    Given a local match is awaiting an action from another seat
    When the required actor changes
    Then the screen names that person before enabling their controls
    When that person acknowledges the handoff
    Then commands use that seat's server-issued credential
    And a different seat cannot roll on its behalf

  @AC-35
  Scenario: Bidders explicitly choose who is acting on the shared device
    Given a local property auction is pending
    When an eligible person selects their seat and acknowledges the handoff
    Then they can submit an affordable bid or a permitted final pass
    And settlement pays and awards the property once
    And the original turn owner resumes after the auction

  @AC-36
  Scenario: Refresh and a lost response preserve a local decision
    Given a local decision and all seat sessions are saved in the browser
    When the page refreshes
    Then the same match and pending decision return with the latest revision
    And unrevealed deck order remains hidden
    When an accepted command response is lost and its original command is retried
    Then the saved receipt returns without a second payment or settlement

  @AC-37
  Scenario: Local players can resolve the authored full-match decisions
    Given a local authored match is running
    When jail, debt, acquisition, building demand or a trade requires a choice
    Then the shared screen identifies the responsible seat and offers the relevant controls
    And property management shows costs and consequences before submission
    And eliminating the last rival displays the server's winner

  @AC-38
  Scenario: Keyboard and phone-width input share the local-play workflow
    Given the local page at desktop or 360 CSS pixels with reduced motion
    When players navigate with keyboard or touch
    Then setup, handoff, decisions and the space list remain operable and readable
    And the space list identifies each occupied space and the active player's location
    And losing sync preserves the last view and disables submissions until recovery
