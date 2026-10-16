import { describe, expect, it } from 'vitest';
import type { SessionFacts } from './progress';
import { progressSeries, progressSummary } from './stats';

const s = (createdAt: number, effectiveWpm: number, mode: SessionFacts['mode'] = 'explore'): SessionFacts => ({
  textId: 'x',
  mode,
  wpm: effectiveWpm + 20,
  comprehension: 0.8,
  effectiveWpm,
  createdAt,
});

describe('progressSeries', () => {
  it('sorts, filters by mode and keeps the latest points', () => {
    const data = [s(3, 130), s(1, 100), s(2, 110, 'rsvp'), s(4, 140)];
    expect(progressSeries(data, 'explore').map((p) => p.effectiveWpm)).toEqual([100, 130, 140]);
    expect(progressSeries(data, 'all', 2).map((p) => [p.n, p.effectiveWpm])).toEqual([
      [1, 130],
      [2, 140],
    ]);
    expect(progressSeries(data, 'all')[0].comprehension).toBe(80);
  });
});

describe('progressSummary', () => {
  it('summarises best, recent comprehension and gain', () => {
    const data = [1, 2, 3, 4].map((i) => s(i, 100 + i * 10));
    expect(progressSummary(data, 2)).toEqual({ reads: 4, bestEffective: 140, recentComprehension: 0.8, effectiveGain: 20 });
    expect(progressSummary([])).toEqual({ reads: 0, bestEffective: 0, recentComprehension: 0, effectiveGain: 0 });
  });
});
