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
  const clamped = Math.min(Math.max(avgWpm * factor, norm.min * 0.5), norm.max * 2);
  return roundTo5(clamped);
}
