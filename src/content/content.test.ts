import { describe, expect, it } from 'vitest';
import { AGE_GROUPS, SUPPORTED_LANGUAGES } from '../lang';
import { getActivityTexts, getLevelTexts, getPlacementTexts, rawContent } from './loader';
import { MAX_LEVEL } from './schema';
import { validateReadingText } from './validate';

describe('content library', () => {
  it('has at least one file', () => {
    expect(Object.keys(rawContent).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(rawContent))('%s is valid', (path, data) => {
    expect(validateReadingText(data, path)).toEqual([]);
  });

  it('has unique ids', () => {
    const ids = Object.values(rawContent).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SUPPORTED_LANGUAGES.flatMap((lang) => AGE_GROUPS.map((age) => [lang, age] as const)))(
    '%s %s has separate, age-appropriate continuation activities', (lang, age) => {
      const activities = getActivityTexts(lang, age);
      expect(activities.map((text) => text.activity).sort()).toEqual(['detective', 'discovery']);
      const mainIds = getLevelTexts(lang, age).flatMap((group) => group.texts.map((text) => text.id));
      for (const activity of activities) {
        expect(mainIds).not.toContain(activity.id);
        expect(activity.wordCount).toBeGreaterThan(100);
      }
    },
  );

  it.each(SUPPORTED_LANGUAGES.flatMap((l) => AGE_GROUPS.map((a) => [l, a] as const)))(
    '%s %s has 2 placement texts',
    (lang, age) => {
      expect(getPlacementTexts(lang, age)).toHaveLength(2);
    },
  );

  it.each(SUPPORTED_LANGUAGES.flatMap((l) => AGE_GROUPS.map((a) => [l, a] as const)))(
    '%s %s has at least 2 texts on every level',
    (lang, age) => {
      const groups = getLevelTexts(lang, age);
      expect(groups.map((g) => g.level)).toEqual(Array.from({ length: MAX_LEVEL }, (_, i) => i + 1));
      for (const g of groups) expect(g.texts.length).toBeGreaterThanOrEqual(2);
    },
  );
});

describe('validateReadingText', () => {
  const base = {
    id: 'x',
    lang: 'tr',
    ageGroup: '10-13',
    level: 0,
    title: 'T',
    author: 'A',
    source: 'S',
    simplified: false,
    body: 'Kedi bahçede oynuyordu. Köpek uyuyordu.',
    glossary: [{ word: 'bahçede', meaning: 'bahçe içinde' }],
    questions: [
      { id: 'q1', type: 'trueFalse', prompt: 'p', answer: true },
      { id: 'q2', type: 'wordRecall', prompt: 'p', options: ['kedi', 'kuş'], answer: 0 },
      { id: 'q3', type: 'ordering', prompt: 'p', items: ['a', 'b', 'c'] },
    ],
  };
  const path = '/content/tr/10-13/placement/x.json';

  it('accepts a valid text', () => {
    expect(validateReadingText(base, path)).toEqual([]);
  });

  it('rejects mismatched folder', () => {
    expect(validateReadingText(base, '/content/tr/14-18/placement/x.json')).toHaveLength(1);
  });

  it('rejects glossary words missing from body and wrong recall distractors', () => {
    const bad = {
      ...base,
      glossary: [{ word: 'deniz', meaning: 'm' }],
      questions: [...base.questions.slice(0, 1), { id: 'q2', type: 'wordRecall', prompt: 'p', options: ['kuş', 'köpek'], answer: 0 }, base.questions[2]],
    };
    expect(validateReadingText(bad, path)).toHaveLength(3);
  });

  it('rejects too few questions', () => {
    expect(validateReadingText({ ...base, questions: base.questions.slice(0, 2) }, path)).toHaveLength(1);
  });
});
