import { describe, expect, it } from 'vitest';
import { scoreSession, streakDays } from './scoring';

describe('scoreSession', () => {
  const base = { mode: 'explore' as const, wpm: 200, comprehension: 0.8, effectiveWpm: 160, targetWpm: 180, streakDays: 1 };

  it('uses effective wpm as base and adds target bonus', () => {
    expect(scoreSession(base)).toEqual({ base: 160, multiplier: 1, targetBonus: 50, perfectBonus: 0, streakBonus: 0, total: 210 });
  });

  it('withholds target bonus when comprehension is too low or target missed', () => {
    expect(scoreSession({ ...base, comprehension: 0.4, effectiveWpm: 80 }).targetBonus).toBe(0);
    expect(scoreSession({ ...base, wpm: 150, effectiveWpm: 120 }).targetBonus).toBe(0);
    expect(scoreSession({ ...base, targetWpm: null }).targetBonus).toBe(0);
  });

  it('applies mode multiplier, perfect and capped streak bonus', () => {
    const s = scoreSession({ ...base, mode: 'voice', comprehension: 1, effectiveWpm: 200, streakDays: 20 });
    expect(s.base).toBe(300);
    expect(s.perfectBonus).toBe(25);
    expect(s.streakBonus).toBe(70);
    expect(s.total).toBe(300 + 50 + 25 + 70);
  });
});

describe('streakDays', () => {
  const day = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();

  it('counts consecutive days ending today', () => {
    expect(streakDays([day(14), day(15, 8), day(15, 20), day(16)], day(16, 23))).toBe(3);
  });

  it('breaks on a gap and is zero without activity today', () => {
    expect(streakDays([day(12), day(14), day(16)], day(16))).toBe(1);
    expect(streakDays([day(15)], day(16))).toBe(0);
  });

  it('crosses month boundaries', () => {
    expect(streakDays([new Date(2026, 8, 30).getTime(), new Date(2026, 9, 1).getTime()], new Date(2026, 9, 1, 18).getTime())).toBe(2);
  });
});
