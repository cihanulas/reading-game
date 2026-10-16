import { getLanguagePack, type AgeGroup, type LangCode } from '../lang';
import { MAX_LEVEL, PLACEMENT_LEVEL, type ReadingText } from './schema';

export interface LoadedText extends ReadingText {
  wordCount: number;
}

const modules = import.meta.glob<ReadingText>('/content/**/*.json', { eager: true, import: 'default' });

export const rawContent: Record<string, ReadingText> = modules;

const allTexts: LoadedText[] = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, text]) => {
    const pack = getLanguagePack(text.lang as LangCode);
    return { ...text, wordCount: pack.tokenize(text.body).length };
  });

export function getTexts(lang: LangCode, ageGroup: AgeGroup, level: number): LoadedText[] {
  return allTexts.filter((t) => t.lang === lang && t.ageGroup === ageGroup && t.level === level);
}

export function getPlacementTexts(lang: LangCode, ageGroup: AgeGroup): LoadedText[] {
  return getTexts(lang, ageGroup, PLACEMENT_LEVEL);
}

/** Game texts (level ≥ 1) grouped by level, ascending. */
export function getLevelTexts(lang: LangCode, ageGroup: AgeGroup): { level: number; texts: LoadedText[] }[] {
  const groups: { level: number; texts: LoadedText[] }[] = [];
  for (let level = PLACEMENT_LEVEL + 1; level <= MAX_LEVEL; level++) {
    const texts = getTexts(lang, ageGroup, level);
    if (texts.length > 0) groups.push({ level, texts });
  }
  return groups;
}

export function getTextById(id: string): LoadedText | undefined {
  return allTexts.find((t) => t.id === id);
}
