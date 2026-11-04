@F-02
Feature: Resolve a property turn on the synthetic board

  @AC-04
  Scenario: A purchase transfers cash and title together
    Given the active seat has landed on an unowned property it can afford
    When the active seat buys the property
    Then it owns the property and its cash falls by the listed price
    And the turn awaits the end command

  @AC-05
  Scenario: A declined property is awarded to the remaining bidder
    Given the active seat has landed on an unowned property
    When the active seat declines the purchase
    And the other seat submits an affordable opening bid
    And the active seat passes in the auction
    Then the other seat owns the property at its accepted bid price
    And the auction settles once

  @AC-06
  Scenario: Affordable rent is paid before ending the turn
    Given the active seat can afford the rent on a rival property
    When its authoritative roll lands on that property
    Then the listed rent transfers to the owner once
    When the active seat ends the turn
    Then the next eligible seat can roll
