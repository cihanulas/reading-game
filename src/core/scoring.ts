import type { ReadingMode } from '../db/db';

export const MODE_MULTIPLIER: Record<ReadingMode, number> = {
  placement: 1,
  explore: 1,
  pacer: 1.2,
  rsvp: 1.3,
  voice: 1.5,
};

export const TARGET_BONUS = 50;
export const PERFECT_BONUS = 25;
export const STREAK_BONUS_PER_DAY = 10;
export const MAX_STREAK_BONUS_DAYS = 7;
/** Below this comprehension a fast read is not rewarded with the target bonus. */
export const MIN_COMPREHENSION_FOR_TARGET = 0.6;

export interface ScoreInput {
  mode: ReadingMode;
  wpm: number;
  comprehension: number;
  effectiveWpm: number;
  targetWpm: number | null;
  streakDays: number;
}

export interface ScoreBreakdown {
  base: number;
  multiplier: number;
  targetBonus: number;
  perfectBonus: number;
  streakBonus: number;
  total: number;
}

export function scoreSession(input: ScoreInput): ScoreBreakdown {
  const multiplier = MODE_MULTIPLIER[input.mode];
  const base = Math.round(input.effectiveWpm * multiplier);
  const reachedTarget =
    input.targetWpm !== null && input.wpm >= input.targetWpm && input.comprehension >= MIN_COMPREHENSION_FOR_TARGET;
  const targetBonus = reachedTarget ? TARGET_BONUS : 0;
  const perfectBonus = input.comprehension === 1 ? PERFECT_BONUS : 0;
  const streakBonus = Math.min(Math.max(input.streakDays - 1, 0), MAX_STREAK_BONUS_DAYS) * STREAK_BONUS_PER_DAY;
  return { base, multiplier, targetBonus, perfectBonus, streakBonus, total: base + targetBonus + perfectBonus + streakBonus };
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Consecutive local calendar days with activity, counting back from `now` (today must have activity). */
export function streakDays(activityTimes: number[], now: number): number {
  const days = new Set(activityTimes.map(dayKey));
  const cursor = new Date(now);
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive activity days ever. */
export function longestStreak(activityTimes: number[]): number {
  return activityTimes.reduce((best, t) => Math.max(best, streakDays(activityTimes, t)), 0);
}
