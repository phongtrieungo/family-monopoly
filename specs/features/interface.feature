@F-04
Feature: Play from desktop and phone

  @AC-10
  Scenario Outline: The active seat can inspect its destination without animation
    Given the player uses the <view> with reduced motion
    When the player opens the space list using <input>
    Then the current destination is identified by name and position
    And the current legal action is reachable using <input>

    Examples:
      | view    | input    |
      | desktop | keyboard |
      | mobile  | touch    |
