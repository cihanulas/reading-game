import { stripPunctuation, unicodeTokenize } from './shared';
import type { LanguagePack } from './types';

const CIRCUMFLEX: Record<string, string> = { â: 'a', î: 'i', û: 'u' };

export const tr: LanguagePack = {
  code: 'tr',
  speechLocale: 'tr-TR',
  wpmNorms: {
    '10-13': { min: 120, max: 160 },
    '14-18': { min: 170, max: 220 },
  },
  normalize(word) {
    return stripPunctuation(word)
      .toLocaleLowerCase('tr-TR')
      .replace(/[âîû]/g, (c) => CIRCUMFLEX[c])
      .replace(/’/g, "'");
  },
  tokenize: unicodeTokenize,
};
