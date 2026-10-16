import type { ReadingMode } from '../db/db';
import type { SessionFacts } from './progress';

export interface ProgressPoint {
  n: number;
  createdAt: number;
  mode: ReadingMode;
  wpm: number;
  effectiveWpm: number;
  comprehension: number;
}

export const CHART_LIMIT = 30;

/** Chronological chart points for one mode (or all), keeping the most recent `limit`. */
export function progressSeries(sessions: SessionFacts[], mode: ReadingMode | 'all', limit = CHART_LIMIT): ProgressPoint[] {
  return sessions
    .filter((s) => mode === 'all' || s.mode === mode)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-limit)
    .map((s, i) => ({
      n: i + 1,
      createdAt: s.createdAt,
      mode: s.mode,
      wpm: s.wpm,
      effectiveWpm: s.effectiveWpm,
      comprehension: Math.round(s.comprehension * 100),
    }));
}

export interface ProgressSummary {
  reads: number;
  bestEffective: number;
  /** Average comprehension (0..1) of the last `window` reads. */
  recentComprehension: number;
  /** Change in average effective speed between the first and last `window` reads. */
  effectiveGain: number;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function progressSummary(sessions: SessionFacts[], window = 5): ProgressSummary {
  const sorted = [...sessions].sort((a, b) => a.createdAt - b.createdAt);
  const first = sorted.slice(0, window).map((s) => s.effectiveWpm);
  const last = sorted.slice(-window).map((s) => s.effectiveWpm);
  return {
    reads: sorted.length,
    bestEffective: Math.max(0, ...sorted.map((s) => s.effectiveWpm)),
    recentComprehension: avg(sorted.slice(-window).map((s) => s.comprehension)),
    effectiveGain: sorted.length > window ? Math.round(avg(last) - avg(first)) : 0,
  };
}
