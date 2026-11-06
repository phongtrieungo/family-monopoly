@F-07 @ST-201 @B-11
Feature: Compare local game renderers with the same synthetic server result
  This isolated spike demonstrates presentation only and does not change match rules.

  @AC-39
  Scenario: Both renderers show the same accepted movement
    Given the synthetic fixture awaits an authoritative roll
    When its server accepts dice one and one
    Then Phaser and React/SVG show the same destination
    And the readable space list names the player at that destination
    And a duplicate command returns the original receipt without a second transition

  @AC-40
  Scenario: The result remains readable without WebGL or animation
    Given the same synthetic result is available
    When WebGL is unavailable or the player skips motion
    Then the board and text show the accepted destination
    And a reduced-motion view presents the same dice and location
    And the 360-pixel view remains operable without horizontal scrolling
