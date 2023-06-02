Feature: Conclude a swap
  Successfully complete a swap between 2 accounts

  Scenario: Swap complete
    Given resource holders
    | id    | balance   |
    | 1     | 0TV       |
    | 2     | 0TV       |
    And resource holder with available resources
    | title                                     | resource holder id    |
    | firewood 40kg                             | 1                     |
    | 1 hour of accompanied workshop usage      | 1                     |
    | Place for a collective workshop, 3 hours  | 2                     |
    When resource holders agree on swapping
    | resource title                            | amount    | resource holder id    |
    | firewood 40kg                             | 1         | 1                     |
    | 1 hour of accompanied workshop usage      | 1         | 1                     |
    | Place for a collective workshop, 3 hours  | 1         | 2                     |
    And resource holders evaluate the swap value
    | resouce holder id | value     |
    | 1                 | 1 TV 30€  |
    | 2                 | 3 TV 15€  |
    Then the swap is registered
    And resource holder balances
    | resource holder id    | balance   |
    | 1                     | 3 TV 15€  |
    | 2                     | 1 TV 30€  |