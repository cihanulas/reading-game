import { de } from './de';
import { tr } from './tr';
import type { LanguagePack } from './types';

export const languagePacks = { tr, de } satisfies Record<string, LanguagePack>;

export type LangCode = keyof typeof languagePacks;

export const SUPPORTED_LANGUAGES = Object.keys(languagePacks) as LangCode[];

export const DEFAULT_LANGUAGE: LangCode = 'tr';

export function isLangCode(value: string): value is LangCode {
  return value in languagePacks;
}

export function getLanguagePack(code: LangCode): LanguagePack {
  return languagePacks[code];
}

export type { AgeGroup, LanguagePack, WpmNorm } from './types';
export { AGE_GROUPS } from './types';
