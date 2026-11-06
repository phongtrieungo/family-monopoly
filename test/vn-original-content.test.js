import { expect, test } from 'bun:test';

import {
  validateVnOriginalContent,
  vnNeighborhoodBoard,
  vnOriginalDecks,
  vnOriginalRules,
} from '../src/domain/vn-original-content.js';

test('B-08 authored content keeps stable board, rules and deck identities', () => {
  expect(validateVnOriginalContent()).toBe(true);
  expect(vnOriginalRules).toEqual({ id: 'vn-original-v1', version: 1, startCash: 1200, startAward: 160 });
  expect(vnNeighborhoodBoard.spaces.map(({ id }) => id)).toEqual(
    Array.from({ length: 40 }, (_, position) => `VN-S${String(position).padStart(2, '0')}`),
  );
  expect(vnNeighborhoodBoard.economy['VN-S11'].rents).toEqual([12, 24, 60, 180, 400, 540, 700]);
  expect(vnOriginalDecks.chance.map(({ id }) => id)).toContain('VN-C09');
  expect(vnOriginalDecks.community.map(({ id }) => id)).toContain('VN-M10');
});

test('B-08 authored content rejects a missing stable space and repeated card', () => {
  const board = structuredClone(vnNeighborhoodBoard);
  board.spaces[1].id = board.spaces[0].id;
  expect(() => validateVnOriginalContent(board)).toThrow('Invalid or duplicate VN board space');

  const decks = structuredClone(vnOriginalDecks);
  decks.chance[1].id = decks.chance[0].id;
  expect(() => validateVnOriginalContent(vnNeighborhoodBoard, decks)).toThrow('Invalid chance deck');
});

test('B-08 content validation rejects invalid economy, group and card-effect references', () => {
  const board = structuredClone(vnNeighborhoodBoard);
  board.spaces[1].economy.rents[0] = -1;
  expect(() => validateVnOriginalContent(board)).toThrow('economy');
  const badGroup = structuredClone(vnNeighborhoodBoard); badGroup.spaces[1].groupId = 'unknown';
  expect(() => validateVnOriginalContent(badGroup)).toThrow('group reference');
  const decks = structuredClone(vnOriginalDecks); decks.chance[0].destination = 40;
  expect(() => validateVnOriginalContent(vnNeighborhoodBoard, decks)).toThrow('destination');
});
