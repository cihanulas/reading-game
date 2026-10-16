import { describe, expect, it } from 'vitest';
import { tr } from './tr';

describe('tr language pack', () => {
  it('counts apostrophe-suffixed words as one', () => {
    expect(tr.tokenize("Kardeşim Hasan'la artık, Dadaruh'un yanından ayrılmıyorduk.")).toEqual([
      'Kardeşim',
      "Hasan'la",
      'artık',
      "Dadaruh'un",
      'yanından',
      'ayrılmıyorduk',
    ]);
  });

  it('ignores dashes and ellipses used as punctuation', () => {
    expect(tr.tokenize('— Hadi yap! derdi... tık... tık')).toEqual(['Hadi', 'yap', 'derdi', 'tık', 'tık']);
  });

  it('applies Turkish dotted/dotless i casing', () => {
    expect(tr.normalize('İSTANBUL')).toBe('istanbul');
    expect(tr.normalize('IŞIK')).toBe('ışık');
  });

  it('folds circumflex vowels and strips edge punctuation', () => {
    expect(tr.normalize('"nâm,')).toBe('nam');
    expect(tr.normalize('Kâğıt!')).toBe('kağıt');
  });
});
