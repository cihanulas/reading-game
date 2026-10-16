import { describe, expect, it } from 'vitest';
import { comprehensionRatio, effectiveWpm, initialTargetWpm, wordsPerMinute } from './reading';
import { Stopwatch } from './stopwatch';

describe('reading metrics', () => {
  it('computes words per minute', () => {
    expect(wordsPerMinute(300, 90_000)).toBe(200);
    expect(wordsPerMinute(100, 0)).toBe(0);
  });

  it('computes comprehension and effective wpm', () => {
    expect(comprehensionRatio(4, 5)).toBe(0.8);
    expect(comprehensionRatio(0, 0)).toBe(0);
    expect(effectiveWpm(200, 0.8)).toBe(160);
  });
});

describe('initialTargetWpm', () => {
  const norm = { min: 120, max: 160 };

  it('raises target slightly with good comprehension', () => {
    expect(initialTargetWpm([{ wpm: 140, comprehension: 1 }, { wpm: 160, comprehension: 0.8 }], norm)).toBe(160);
  });

  it('keeps target at measured speed with medium comprehension', () => {
    expect(initialTargetWpm([{ wpm: 150, comprehension: 0.6 }], norm)).toBe(150);
  });

  it('lowers target with poor comprehension', () => {
    expect(initialTargetWpm([{ wpm: 200, comprehension: 0.4 }], norm)).toBe(180);
  });

  it('clamps unrealistic values', () => {
    expect(initialTargetWpm([{ wpm: 2000, comprehension: 1 }], norm)).toBe(320);
    expect(initialTargetWpm([{ wpm: 10, comprehension: 1 }], norm)).toBe(60);
    expect(initialTargetWpm([], norm)).toBe(120);
  });
});

describe('Stopwatch', () => {
  it('excludes paused time', () => {
    let t = 0;
    const sw = new Stopwatch(() => t);
    sw.start();
    t = 1000;
    sw.pause();
    t = 5000;
    sw.start();
    t = 6500;
    expect(sw.elapsedMs).toBe(2500);
    sw.pause();
    expect(sw.running).toBe(false);
    sw.reset();
    expect(sw.elapsedMs).toBe(0);
  });
});
