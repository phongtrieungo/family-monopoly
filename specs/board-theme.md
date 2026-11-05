# Vietnam board and theme

Use a modern, original visual identity. Consider Hanoi, Huế and Cần Thơ as example place labels for an internal content review. Use Vietnamese diacritics, abstract architectural or landscape motifs, distinct group symbols, and readable token silhouettes. The prototype uses neutral branding and original UI copy.

## Board contract

Pin a board ID and version alongside the rules profile at match creation. Each space has a stable ID, unique contiguous position, type and localization key. Ownable spaces carry a group reference and economy reference. Deck spaces reference a deck ID. Rules interpret types and effect IDs. Theme metadata supplies display text, icon and style tokens.

Validate references, unique IDs and indices, ordered movement with wraparound, group membership, supported effects and nonnegative integer economy values. Reject inconsistent board/rules pairs at startup. A short synthetic board may expose start, purchasable property, rival property and inert space for the vertical slice. Its values and layout are fixture data. The full space order, card effects, exact amounts and grouping need edition verification or explicit approval as original content.

Store localized copy separately from rule data. Use source IDs for factual claims and asset IDs for visuals when content enters review. See [research and licensing](research/licensing.md).

## Full-match content

The [original content profile](research/content-profile.md) defines the 40-space Vietnam board, group references, authored economy and two original decks. B-08 introduces it under explicit versioned selection.
