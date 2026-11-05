@F-05 @vn-original-v1
Feature: Resolve the original Vietnamese full-match profile
  These are B-08 acceptance contracts for project-authored content and digital policies.
  C1009 procedure locators are recorded in the edition review.

  @AC-11
  Scenario: Automatic rent pauses for a debt without charging twice
    Given the active seat lands on a rival's unmortgaged property in vn-original-v1
    And its cash cannot cover the lawful rent
    When the server resolves the landing under DP-01
    Then the turn waits for debt resolution
    And the saved obligation identifies the property, debtor and owner
    When the debtor raises enough cash and settles
    Then one rent ledger entry pays the owner
    And the saved landing continues once

  @AC-12
  Scenario: The authored profile enforces its auction opening price
    Given an unowned property is being auctioned in vn-original-v1
    When an eligible seat bids 9 xu
    Then the command is rejected without changing the room
    When the same seat bids 10 xu at the current revision
    Then that bid becomes the high bid

  @AC-13
  Scenario: A bid cannot depend on unrelated spending during an auction
    Given a property auction is pending
    When a seat submits a mortgage or trade command
    Then the command is rejected under DP-03
    And cash, ownership and the high bid remain unchanged

  @AC-14
  Scenario: A card collection survives reconnect and a debtor's liquidation
    Given VN-M05 is collecting 10 xu from each other solvent seat
    And the next debtor needs liquidation before payment
    When that debtor reconnects and settles the saved obligation
    Then that debtor pays 10 xu once
    And the card continues with the next debtor in saved seat order
    And the card returns to the bottom only after its work finishes

  @AC-15
  Scenario: A retained release card remains out of its deck
    Given a jailed seat holds VN-C09
    When that seat uses it at the start of its turn
    Then the card returns to the bottom of the chance deck
    And the seat is released before rolling
    And unrevealed deck order remains server-side

  @AC-16
  Scenario: Replay preserves original content and setup outcomes
    Given a match pins vn-original-v1 and vn-neighborhood-v1
    When the accepted setup rolls, deck order and commands are replayed
    Then the same first seat, card effects and balances are reconstructed
    And a later content version does not replace that match's data

  @AC-17
  Scenario: Forced jail movement does not award start money
    Given the active seat draws VN-C08
    When the server resolves the card
    Then the seat moves to jail without a start award
    And its turn ends

  @AC-18
  Scenario: Card repairs count hotels separately from houses
    Given a seat owns one hotel and two individual houses
    When that seat draws VN-C15
    Then its repair obligation to the bank is 110 xu

  @AC-19
  Scenario: Creditor bankruptcy transfers the retained card to the creditor
    Given a seat holds VN-C09 and owes another player
    When that seat completes bankruptcy settlement
    Then the creditor receives VN-C09
    And VN-C09 remains outside the chance deck

  @AC-20
  Scenario: Bankruptcy to the bank returns a retained card to its own deck
    Given a seat holds VN-M10 and owes the bank
    When that seat completes bankruptcy settlement
    Then VN-M10 returns to the bottom of the community deck
    And no solvent seat receives that card

  @AC-21
  Scenario: Keeping an acquired mortgage creates a separate interest obligation
    Given a seat acquires a property with mortgage principal 90
    When the seat chooses to keep the mortgage
    Then it owes the bank 9 xu immediately
    And a later release costs 99 xu
    And retrying the acquisition settlement adds no second interest charge

  @AC-22
  Scenario: A card gift drawer becomes bankrupt partway through its recipients
    Given VN-C16 has paid its first recipient
    And the drawer cannot settle the gift owed to its second recipient
    When the drawer completes bankruptcy settlement to the second recipient
    Then the first gift remains committed
    And gifts to later recipients are canceled
    And the in-flight VN-C16 returns to its deck

  @AC-23
  Scenario: A final bankruptcy ends play after creditor obligations
    Given only two solvent seats remain
    And VN-M05 creates a debt from one seat to the other
    When the debtor is eliminated
    Then mandatory creditor acquisition obligations finish
    And the remaining seat wins
    And no further card transfer or roll is accepted

  @AC-24
  Scenario: Competing demand for the final house opens an auction
    Given the bank has one house left
    And two seats have legal construction targets
    When one seat requests that house
    Then the server reserves the token without charging for it
    And both eligible seats can register or decline demand
    When both seats register legal targets
    Then the server opens a building auction at 10 xu
    And the winner's payment, development and stock change settle once

  @AC-25
  Scenario: Hotel liquidation continues when the bank has no houses
    Given a seat owns hotels on all three streets in G3
    And the bank has no available houses
    When the seat liquidates that group under DP-10
    Then all three streets have no buildings
    And three hotels return to the bank
    And the seat receives 120 xu once
    And bank house stock remains zero

  @AC-26
  Scenario: Hotel liquidation uses only available replacement houses
    Given a seat owns hotels on all three streets in G3
    And the bank has two available houses
    When the seat liquidates the group with final house counts 1, 1 and 0
    Then three hotels return to the bank
    And bank house stock becomes zero
    And the seat receives 120 xu
    And no fictitious houses enter circulation

  @AC-27
  Scenario: Disconnect preserves a last-building demand round
    Given the final house is reserved for a demand round
    And an invited seat has not yet registered or declined
    When that seat disconnects
    Then the reservation and its pending response are preserved
    And no first-request sale occurs
    When that seat reconnects
    Then it can respond at the latest room revision
