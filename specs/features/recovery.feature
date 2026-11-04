@F-03
Feature: Preserve authoritative decisions across refresh and retries

  @AC-07
  Scenario: Refresh during a purchase decision restores the seat
    Given a seat is awaiting a purchase decision
    When that seat reconnects using its session
    Then the snapshot identifies the original seat
    And it shows the pending purchase at the latest revision

  @AC-08
  Scenario: A retry with an old revision returns the original result
    Given the server committed a purchase and the client missed the response
    When the seat retries the same command ID and payload with the original revision
    Then it receives the original result
    And the property and cash changes occur only once

  @AC-09
  Scenario: A nonactive seat cannot roll
    Given the room is awaiting the active seat's roll
    When a different seat submits a roll
    Then the server rejects the command
    And the room revision and dice state remain unchanged
