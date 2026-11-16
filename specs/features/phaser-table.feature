Feature: Phaser canvas table for the shared-browser full match

  @AC-41
  Scenario: Play with no visible HTML game controls
    Given the shared-browser local game is open
    When a family starts a match using Vietnamese names, hands off turns, acts, inspects the board, opens settings and finishes the match
    Then all visible game controls and feedback are drawn by Phaser
    And the same legal actions are operable by keyboard and mouse
    And assistive technology exposes control names, state, focus and accepted outcomes

  @AC-42
  Scenario: Read the illustrated 2D table on large desktop displays
    Given a local match with 40 board spaces and two to four seats
    When the table is viewed at the target desktop resolutions and minimum supported browser viewport
    Then players can identify the active seat and locate its token on the top-down board
    And every space can be inspected for its readable name, occupants and applicable ownership
    And essential controls are reachable without page scrolling during a normal turn

  @AC-43
  Scenario Outline: Present every cell in a confirmed movement route
    Given the renderer has the accepted starting position and a newly accepted movement route
    When the token moves along a <route> with motion enabled
    Then each traversed cell is shown in order before the token settles on the accepted destination
    And the motion sends no game command

    Examples:
      | route                     |
      | forward dice move         |
      | forward move past start   |
      | backward card move        |
      | chained roll and card move |

  @AC-44
  Scenario Outline: Reconcile token presentation to the accepted snapshot
    Given a local match with an accepted player position
    When presentation encounters <condition>
    Then the token settles at the accepted position without inventing a route
    And pending decisions are usable regardless of animation state

    Examples:
      | condition                    |
      | a roll without jail release  |
      | a direct transfer to jail    |
      | Skip during a route          |
      | reduced motion               |
      | refresh during movement      |
      | a gap in accepted history    |

  @AC-45
  Scenario: Recover a full-match decision in the canvas
    Given an accepted local decision that requires an explicit seat and consequence
    When the player refreshes or retries after an accepted command response is lost
    Then the canvas shows the latest accepted decision or outcome for the correct seat
    And the original command is applied at most once
    And a finished match displays the server-recorded winner

  @AC-46
  Scenario: Explain a turn when another player must make the next decision
    Given a local turn with an accepted roll and a declined purchase
    And the accepted auction requires a bid or pass from a different seat
    When the family hands the device to the named bidder
    Then the decision area identifies the turn owner, bidder, lot, current price or opening minimum, and legal choices
    And turn details show the accepted roll, landing, decline and auction actions in order with their acting seats
    And opening and closing turn details leaves the auction decision available to the same bidder
