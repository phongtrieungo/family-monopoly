@F-01
Feature: Invite-only lobby

  @AC-01
  Scenario: Two ready seats start a match
    Given a host has created a private lobby
    When a guest joins with the lobby invite
    And both seats mark themselves ready
    And the host starts the match
    Then the roster is frozen with two seats
    And the invite no longer admits new guests

  @AC-02
  Scenario: An unready group cannot start
    Given a lobby has one ready host and one unready guest
    When the host attempts to start
    Then the room remains in the lobby
    And the host sees which seat is unready

  @AC-03
  Scenario: An invalid invite does not expose a room
    When a visitor submits an invalid invite
    Then the visitor sees an invalid invite message
    And the visitor receives no room snapshot
