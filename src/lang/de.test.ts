import { describe, expect, it } from 'vitest';
import { de } from './de';

describe('de language pack', () => {
  it('keeps compounds and apostrophe forms as one word', () => {
    expect(de.tokenize('„Kannitverstan!“ rief er, geht’s nach Amsterdam-Nord?')).toEqual([
      'Kannitverstan',
      'rief',
      'er',
      'geht’s',
      'nach',
      'Amsterdam-Nord',
    ]);
  });

  it('folds ß to ss and keeps umlauts', () => {
    expect(de.normalize('Straße')).toBe(de.normalize('STRASSE'));
    expect(de.normalize('Größe,')).toBe('grösse');
  });

  it('folds old spelling th to t', () => {
    expect(de.normalize('Thür')).toBe(de.normalize('Tür'));
  });
});
