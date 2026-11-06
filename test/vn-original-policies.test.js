import { expect, test } from 'bun:test';

import {
  liquidateHotelGroup,
  mortgageCharges,
  validateVnAuctionCommand,
} from '../src/domain/vn-original-policies.js';

const auction = () => ({
  phase: 'Auction', seats: [{ id: 'a', cash: 100 }, { id: 'b', cash: 100 }],
  auction: { eligibleSeatIds: ['a', 'b'], highBid: null },
});

test('AC-12: vn-original-v1 auctions enforce the 10 xu opening price', () => {
  const state = auction();
  expect(() => validateVnAuctionCommand(state, { type: 'Bid', actorId: 'a', amount: 9 })).toThrow('opening price');
  expect(validateVnAuctionCommand(state, { type: 'Bid', actorId: 'a', amount: 10 })).toBe(true);
  state.auction.highBid = { seatId: 'a', amount: 10 };
  expect(() => validateVnAuctionCommand(state, { type: 'Bid', actorId: 'b', amount: 10 })).toThrow('opening price');
});

test('AC-13: unrelated commands are rejected during a vn-original-v1 auction', () => {
  expect(() => validateVnAuctionCommand(auction(), { type: 'Mortgage', actorId: 'a', propertyId: 'VN-S01' }))
    .toThrow('Only auction commands');
});

test('AC-21: mortgage interest is rounded up and remains a distinct obligation', () => {
  expect(mortgageCharges(90)).toEqual({ principal: 90, immediateInterest: 9, releaseTotal: 99 });
  expect(mortgageCharges(5)).toEqual({ principal: 5, immediateInterest: 1, releaseTotal: 6 });
  expect(() => mortgageCharges(-1)).toThrow('Invalid mortgage');
});

const costs = new Map([['VN-S11', 80], ['VN-S13', 80], ['VN-S14', 80]]);
const hotels = [
  { id: 'VN-S11', houses: 0, hotels: 1 },
  { id: 'VN-S13', houses: 0, hotels: 1 },
  { id: 'VN-S14', houses: 0, hotels: 1 },
];

test('AC-25: DP-10 returns hotels atomically when no replacement houses exist', () => {
  expect(liquidateHotelGroup({
    streets: hotels, bankHouses: 0, bankHotels: 9, constructionCosts: costs, proposedFinalCounts: [0, 0, 0],
  })).toEqual({
    streets: hotels.map(({ id }) => ({ id, houses: 0, hotels: 0 })),
    bankHouses: 0, bankHotels: 12, refund: 120,
  });
});

test('AC-26: DP-10 uses only available replacement houses and does not invent stock', () => {
  const result = liquidateHotelGroup({
    streets: hotels, bankHouses: 2, bankHotels: 9, constructionCosts: costs, proposedFinalCounts: [1, 1, 0],
  });
  expect(result.streets.map(({ houses }) => houses)).toEqual([1, 1, 0]);
  expect(result.bankHouses).toBe(0);
  expect(result.bankHotels).toBe(12);
  expect(result.refund).toBe(120);
  expect(() => liquidateHotelGroup({
    streets: hotels, bankHouses: 2, bankHotels: 9, constructionCosts: costs, proposedFinalCounts: [1, 1, 1],
  })).toThrow('availability or evenness');
});
