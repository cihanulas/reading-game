import { stripPunctuation, unicodeTokenize } from './shared';
import type { LanguagePack } from './types';

export const de: LanguagePack = {
  code: 'de',
  speechLocale: 'de-DE',
  wpmNorms: {
    '10-13': { min: 110, max: 150 },
    '14-18': { min: 160, max: 210 },
  },
  normalize(word) {
    return (
      stripPunctuation(word)
        .toLocaleLowerCase('de-DE')
        .replace(/ß/g, 'ss')
        // Old spelling in classic texts ("Thür", "Theil") vs. modern recognizer output.
        .replace(/th/g, 't')
        .replace(/’/g, "'")
    );
  },
  tokenize: unicodeTokenize,
};
