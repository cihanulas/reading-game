import { describe, expect, it } from 'vitest';
import { chunkWeight, clampWpm, displayChunks, groupLines, orpIndex, rsvpDurations } from './pacing';

describe('pacing helpers', () => {
  it('clamps and rounds wpm', () => {
    expect(clampWpm(153)).toBe(150);
    expect(clampWpm(10)).toBe(60);
    expect(clampWpm(5000)).toBe(800);
  });

  it('drops punctuation-only chunks', () => {
    expect(displayChunks('— Geç efendim, geç!\n\n— ......\nTamam.')).toEqual(['Geç', 'efendim,', 'geç!', 'Tamam.']);
  });

  it('weights punctuation and long words', () => {
    expect(chunkWeight('ev')).toBe(1);
    expect(chunkWeight('ev,')).toBe(1.5);
    expect(chunkWeight('ev.')).toBe(2);
    expect(chunkWeight('kamaştıracak.')).toBeCloseTo(2.3);
    expect(chunkWeight('dedi!"')).toBe(2);
  });

  it('keeps the average pace equal to wpm', () => {
    const d = rsvpDurations(['bir', 'iki,', 'üç.', 'dört'], 120);
    expect(d.reduce((a, b) => a + b, 0)).toBeCloseTo(2000);
    expect(d[2]).toBeGreaterThan(d[1]);
    expect(d[1]).toBeGreaterThan(d[0]);
  });

  it('finds the optimal recognition point', () => {
    expect(orpIndex('a')).toBe(0);
    expect(orpIndex('kedi')).toBe(1);
    expect(orpIndex('"Kiralıktır"')).toBe(4);
  });

  it('groups items into lines by vertical position', () => {
    expect(groupLines([0, 0, 0, 30, 30, 61, 60])).toEqual([[0, 3], [3, 5], [5, 7]]);
    expect(groupLines([])).toEqual([]);
  });
});
