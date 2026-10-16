import type { ReadingMode, ReadingSession } from '../db/db';
import { longestStreak, MIN_COMPREHENSION_FOR_TARGET } from './scoring';

/** Fields of a session that gamification rules look at. */
export type SessionFacts = Pick<ReadingSession, 'textId' | 'mode' | 'wpm' | 'comprehension' | 'effectiveWpm' | 'createdAt'> & {
  targetWpm?: number | null;
};

export type IslandId = Exclude<ReadingMode, 'placement'>;
export const ISLANDS: IslandId[] = ['explore', 'pacer', 'rsvp', 'voice'];

/** An island opens after this many successful reads on the previous island. */
export const READS_TO_UNLOCK = 2;
export const PIECES_PER_CHEST = 3;

const isGame = (s: SessionFacts) => s.mode !== 'placement';
/** A read counts toward progress only when it was understood. */
export const isSuccessful = (s: SessionFacts) => isGame(s) && s.comprehension >= MIN_COMPREHENSION_FOR_TARGET;
export const reachedTarget = (s: SessionFacts) =>
  isSuccessful(s) && s.targetWpm != null && s.wpm >= s.targetWpm;

export interface IslandState {
  id: IslandId;
  unlocked: boolean;
  /** Island whose reads unlock this one. */
  requires: IslandId | null;
  /** Successful reads still needed on `requires`. */
  remaining: number;
}

export function islandStates(sessions: SessionFacts[]): IslandState[] {
  return ISLANDS.map((id, i) => {
    const requires = i === 0 ? null : ISLANDS[i - 1];
    const done = requires ? sessions.filter((s) => s.mode === requires && isSuccessful(s)).length : 0;
    const remaining = requires ? Math.max(READS_TO_UNLOCK - done, 0) : 0;
    return { id, unlocked: remaining === 0, requires, remaining };
  });
}

export const unlockedIslands = (sessions: SessionFacts[]) =>
  islandStates(sessions)
    .filter((s) => s.unlocked)
    .map((s) => s.id);

/** Each successful read yields one map piece; every PIECES_PER_CHEST pieces earn a chest. */
export const mapPieces = (sessions: SessionFacts[]) => sessions.filter(isSuccessful).length;
export const chestsEarned = (sessions: SessionFacts[]) => Math.floor(mapPieces(sessions) / PIECES_PER_CHEST);

export type BadgeId =
  | 'firstVoyage'
  | 'bookworm'
  | 'perfect'
  | 'onTarget'
  | 'streak3'
  | 'streak7'
  | 'allIslands'
  | 'speed200'
  | 'recordBreaker';

export const BADGE_ICON: Record<BadgeId, string> = {
  firstVoyage: '⛵',
  bookworm: '📚',
  perfect: '🎯',
  onTarget: '🏹',
  streak3: '🔥',
  streak7: '🌋',
  allIslands: '🗺️',
  speed200: '🚀',
  recordBreaker: '🏆',
};

export const BADGES = Object.keys(BADGE_ICON) as BadgeId[];

function brokeRecord(sessions: SessionFacts[]): boolean {
  const best = new Map<string, number>();
  for (const s of [...sessions].filter(isGame).sort((a, b) => a.createdAt - b.createdAt)) {
    const key = `${s.mode}:${s.textId}`;
    const prev = best.get(key);
    if (prev !== undefined && s.effectiveWpm > prev && isSuccessful(s)) return true;
    best.set(key, Math.max(prev ?? 0, s.effectiveWpm));
  }
  return false;
}

export function earnedBadges(sessions: SessionFacts[]): BadgeId[] {
  const games = sessions.filter(isGame);
  const good = games.filter(isSuccessful);
  const streak = longestStreak(games.map((s) => s.createdAt));
  const rules: Record<BadgeId, boolean> = {
    firstVoyage: good.length >= 1,
    bookworm: good.length >= 10,
    perfect: games.some((s) => s.comprehension === 1),
    onTarget: games.filter(reachedTarget).length >= 3,
    streak3: streak >= 3,
    streak7: streak >= 7,
    allIslands: (['explore', 'pacer', 'rsvp'] as const).every((m) => good.some((s) => s.mode === m)),
    speed200: good.some((s) => s.effectiveWpm >= 200),
    recordBreaker: brokeRecord(games),
  };
  return BADGES.filter((b) => rules[b]);
}

/** Collectibles found in chests. */
export const ITEMS = [
  { id: 'raft', icon: '🛶' },
  { id: 'sailboat', icon: '⛵' },
  { id: 'ship', icon: '🚢' },
  { id: 'pirateFlag', icon: '🏴‍☠️' },
  { id: 'tophat', icon: '🎩' },
  { id: 'crown', icon: '👑' },
  { id: 'spyglass', icon: '🔭' },
  { id: 'compass', icon: '🧭' },
  { id: 'octopus', icon: '🐙' },
  { id: 'turtle', icon: '🐢' },
  { id: 'gem', icon: '💎' },
  { id: 'trident', icon: '🔱' },
] as const;

export type ItemId = (typeof ITEMS)[number]['id'];
export const ITEM_ICON = Object.fromEntries(ITEMS.map((i) => [i.id, i.icon])) as Record<ItemId, string>;
/** Gold given instead of an item once the whole collection is owned. */
export const CHEST_GOLD = 100;

export type ChestReward = { itemId: ItemId; coins: 0 } | { itemId: null; coins: number };

export function pickReward(owned: readonly string[], random: () => number = Math.random): ChestReward {
  const left = ITEMS.filter((i) => !owned.includes(i.id));
  if (left.length === 0) return { itemId: null, coins: CHEST_GOLD };
  return { itemId: left[Math.floor(random() * left.length)].id, coins: 0 };
}
