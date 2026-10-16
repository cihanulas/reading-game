import { describe, expect, it } from 'vitest';
import { tr } from '../lang/tr';
import { alignTranscript, editDistance, wordsMatch } from './speech';

const words = (s: string) => s.split(/\s+/).filter(Boolean).map((w) => tr.normalize(w));

describe('wordsMatch', () => {
  it('accepts exact and near matches for longer words', () => {
    expect(editDistance('kitap', 'kitab')).toBe(1);
    expect(wordsMatch('kitab', 'kitap')).toBe(true);
    expect(wordsMatch('okuyorlardı', 'okuyorlar')).toBe(true);
  });

  it('is strict for short words', () => {
    expect(wordsMatch('bir', 'bu')).toBe(false);
    expect(wordsMatch('ev', 'ev')).toBe(true);
  });
});

describe('alignTranscript', () => {
  const target = words('Küçük kız, bahçedeki — elma ağacına baktı.');

  it('follows a full reading and passes punctuation-only tokens', () => {
    const a = alignTranscript(target, words('küçük kız bahçedeki elma ağacına baktı'));
    expect(a.cursor).toBe(target.length);
    expect(a.matched.every(Boolean)).toBe(true);
    expect(a).toMatchObject({ extra: 0, skipped: 0 });
  });

  it('counts skipped and extra words', () => {
    const a = alignTranscript(target, words('küçük şey bahçedeki ağacına'));
    expect(a.cursor).toBe(6);
    expect(a.skipped).toBe(2);
    expect(a.extra).toBe(1);
    expect(a.matched[3]).toBe(true);
  });

  it('handles Turkish case folding and merged words', () => {
    const t = words('İstanbul bir şey');
    const a = alignTranscript(t, ['istanbul', 'birşey']);
    expect(a.cursor).toBe(3);
    expect(a.skipped).toBe(0);
  });

  it('does not jump beyond the lookahead window', () => {
    const t = words('bir iki üç dört beş altı yedi sekiz');
    expect(alignTranscript(t, ['sekiz']).cursor).toBe(0);
  });
});
