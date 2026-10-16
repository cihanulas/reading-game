export type AgeGroup = '10-13' | '14-18';

export const AGE_GROUPS: readonly AgeGroup[] = ['10-13', '14-18'];

export interface WpmNorm {
  min: number;
  max: number;
}

export interface LanguagePack {
  code: string;
  speechLocale: string;
  wpmNorms: Record<AgeGroup, WpmNorm>;
  /** Lowercases and folds a single word for comparison (glossary, speech matching). */
  normalize(word: string): string;
  tokenize(text: string): string[];
}
