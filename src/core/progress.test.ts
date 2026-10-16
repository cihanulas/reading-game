import { describe, expect, it } from 'vitest';
import {
  chestsEarned,
  CHEST_GOLD,
  earnedBadges,
  islandStates,
  ITEMS,
  mapPieces,
  pickReward,
  unlockedIslands,
  type SessionFacts,
} from './progress';
import { longestStreak } from './scoring';

const day = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();
let seq = 0;
const s = (over: Partial<SessionFacts> = {}): SessionFacts => ({
  textId: `t${seq++}`,
  mode: 'explore',
  wpm: 150,
  comprehension: 0.8,
  effectiveWpm: 120,
  createdAt: day(1),
  ...over,
});

describe('islands', () => {
  it('starts with only the explore island open', () => {
    expect(unlockedIslands([])).toEqual(['explore']);
    expect(islandStates([])[1]).toEqual({ id: 'pacer', unlocked: false, requires: 'explore', remaining: 2 });
  });

  it('unlocks the next island after two successful reads', () => {
    const sessions = [s(), s({ comprehension: 0.4 }), s(), s({ mode: 'pacer' })];
    expect(unlockedIslands(sessions)).toEqual(['explore', 'pacer']);
    expect(islandStates(sessions)[2].remaining).toBe(1);
  });

  it('ignores placement reads', () => {
    expect(unlockedIslands([s({ mode: 'placement' }), s({ mode: 'placement' })])).toEqual(['explore']);
  });
});

describe('chests', () => {
  it('earns one chest per three successful reads', () => {
    const sessions = [s(), s(), s({ comprehension: 0.2 }), s(), s(), s({ mode: 'placement' })];
    expect(mapPieces(sessions)).toBe(4);
    expect(chestsEarned(sessions)).toBe(1);
  });

  it('picks an item not owned yet, then gold', () => {
    const owned = ITEMS.slice(1).map((i) => i.id);
    expect(pickReward(owned, () => 0.99)).toEqual({ itemId: ITEMS[0].id, coins: 0 });
    expect(pickReward(ITEMS.map((i) => i.id))).toEqual({ itemId: null, coins: CHEST_GOLD });
  });
});

describe('badges', () => {
  it('awards nothing without reads', () => {
    expect(earnedBadges([])).toEqual([]);
  });

  it('awards first voyage, perfect, speed and target badges', () => {
    const sessions = [
      s({ comprehension: 1, effectiveWpm: 210, wpm: 210, targetWpm: 200 }),
      s({ targetWpm: 140 }),
      s({ targetWpm: 100 }),
    ];
    expect(earnedBadges(sessions)).toEqual(['firstVoyage', 'perfect', 'onTarget', 'speed200']);
  });

  it('awards streaks, all islands and record breaker', () => {
    const sessions = [
      s({ textId: 'a', createdAt: day(1), effectiveWpm: 100 }),
      s({ textId: 'a', createdAt: day(2), effectiveWpm: 130 }),
      s({ mode: 'pacer', createdAt: day(3) }),
      s({ mode: 'rsvp', createdAt: day(3) }),
    ];
    expect(earnedBadges(sessions)).toEqual(['firstVoyage', 'streak3', 'allIslands', 'recordBreaker']);
  });
});

describe('longestStreak', () => {
  it('finds the longest run anywhere in history', () => {
    expect(longestStreak([day(1), day(2), day(3), day(10), day(11)])).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});
