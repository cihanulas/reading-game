import type { WpmNorm } from '../lang';

export function wordsPerMinute(wordCount: number, activeMs: number): number {
  if (activeMs <= 0) return 0;
  return Math.round((wordCount * 60_000) / activeMs);
}

export function comprehensionRatio(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total;
}

export function effectiveWpm(wpm: number, comprehension: number): number {
  return Math.round(wpm * comprehension);
}

export interface PlacementResult {
  wpm: number;
  comprehension: number;
}

const roundTo5 = (n: number) => Math.round(n / 5) * 5;

/**
 * Starting target: slightly above measured speed if understood well, below if not,
 * clamped to a sane band around the language/age norm.
 */
export function initialTargetWpm(results: PlacementResult[], norm: WpmNorm): number {
  if (results.length === 0) return norm.min;
  const avgWpm = results.reduce((s, r) => s + r.wpm, 0) / results.length;
  const avgComp = results.reduce((s, r) => s + r.comprehension, 0) / results.length;
  const factor = avgComp >= 0.8 ? 1.05 : avgComp >= 0.6 ? 1 : 0.9;
  return clampTarget(avgWpm * factor, norm);
}

const clampTarget = (wpm: number, norm: WpmNorm) => roundTo5(Math.min(Math.max(wpm, norm.min * 0.5), norm.max * 2));

export const TARGET_UP_GOOD = 1.05;
export const TARGET_UP_PERFECT = 1.1;
export const TARGET_DOWN = 0.9;

/**
 * After a game session: raise the target when it was reached with good comprehension
 * (+10% for a perfect score, +5% otherwise), lower it when comprehension was poor.
 */
export function adaptTarget(target: number, wpm: number, comprehension: number, norm: WpmNorm): number {
  let factor = 1;
  if (comprehension < 0.6) factor = TARGET_DOWN;
  else if (comprehension >= 0.8 && wpm >= target) factor = comprehension === 1 ? TARGET_UP_PERFECT : TARGET_UP_GOOD;
  return factor === 1 ? target : clampTarget(target * factor, norm);
}
