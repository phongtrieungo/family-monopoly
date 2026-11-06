// Explicit digital policies for vn-original-v1; keep separate from C1009 rules.
export const VN_AUCTION_OPENING_BID = 10;

export function validateVnAuctionCommand(state, command) {
  if (state.phase !== 'Auction' || !state.auction?.eligibleSeatIds?.includes(command.actorId)) {
    throw new Error('Seat is not eligible for this auction');
  }
  if (!['Bid', 'Pass'].includes(command.type)) {
    throw new Error('Only auction commands are allowed during an auction');
  }
  if (command.type === 'Bid') {
    const floor = state.auction.highBid?.amount ?? VN_AUCTION_OPENING_BID - 1;
    if (!Number.isSafeInteger(command.amount) || command.amount <= floor) {
      throw new Error('Bid must meet the vn-original-v1 opening price and exceed the high bid');
    }
    const seat = state.seats.find(({ id }) => id === command.actorId);
    if (!seat || command.amount > seat.cash) throw new Error('Insufficient cash to bid');
  }
  if (command.type === 'Pass' && state.auction.highBid?.seatId === command.actorId) {
    throw new Error('The leading bidder cannot pass');
  }
  return true;
}

export function mortgageCharges(principal) {
  if (!Number.isSafeInteger(principal) || principal < 0) throw new Error('Invalid mortgage principal');
  const interest = Math.ceil(principal / 10);
  return { principal, immediateInterest: interest, releaseTotal: principal + interest };
}

// Atomic DP-10 accounting. Houses and hotels are counts of physical bank tokens;
// proposedFinalCounts contains the resulting houses on each street.
export function liquidateHotelGroup({ streets, bankHouses, bankHotels, constructionCosts, proposedFinalCounts }) {
  if (!Array.isArray(streets) || streets.length < 2 || !Array.isArray(proposedFinalCounts) ||
      proposedFinalCounts.length !== streets.length || !Number.isSafeInteger(bankHouses) || bankHouses < 0 ||
      !Number.isSafeInteger(bankHotels) || bankHotels < 0) throw new Error('Invalid hotel liquidation input');
  if (!streets.every((street) => Number.isSafeInteger(street.hotels) && street.hotels >= 0 &&
      Number.isSafeInteger(street.houses) && street.houses >= 0 && street.houses <= 4)) {
    throw new Error('Invalid existing development');
  }
  const hotelCount = streets.reduce((sum, street) => sum + street.hotels, 0);
  if (hotelCount === 0 || streets.some((street) => street.hotels > 1 || (street.hotels && street.houses))) {
    throw new Error('Group must contain hotels to liquidate');
  }
  if (hotelCount > 12 - bankHotels) throw new Error('Hotel stock would exceed the bank limit');
  if (!proposedFinalCounts.every((count) => Number.isSafeInteger(count) && count >= 0 && count <= 4)) {
    throw new Error('Invalid final house counts');
  }
  const currentHouses = streets.reduce((sum, street) => sum + street.houses, 0);
  const targetHouses = proposedFinalCounts.reduce((sum, count) => sum + count, 0);
  const available = currentHouses + bankHouses;
  if (targetHouses !== Math.min(available, 4 * streets.length) ||
      Math.max(...proposedFinalCounts) - Math.min(...proposedFinalCounts) > 1) {
    throw new Error('Final house counts violate DP-10 availability or evenness');
  }
  if (streets.some((street) => !Number.isSafeInteger(constructionCosts.get(street.id)) || constructionCosts.get(street.id) < 0)) {
    throw new Error('Missing street construction cost');
  }
  const hotelRefund = streets.reduce((sum, street) => sum + street.hotels * Math.floor(constructionCosts.get(street.id) / 2), 0);
  const costs = streets.map((street) => constructionCosts.get(street.id));
  if (new Set(costs).size !== 1) throw new Error('Group construction costs must match');
  const houseRefund = Math.max(0, currentHouses - targetHouses) * Math.floor(costs[0] / 2);
  return {
    streets: streets.map((street, index) => ({ id: street.id, houses: proposedFinalCounts[index], hotels: 0 })),
    bankHouses: bankHouses + currentHouses - targetHouses,
    bankHotels: bankHotels + hotelCount,
    refund: hotelRefund + houseRefund,
  };
}
