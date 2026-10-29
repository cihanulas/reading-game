import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE } from '../lang';
import { resources } from '.';

const keysOf = (obj: unknown, prefix = ''): string[] =>
  obj && typeof obj === 'object'
    ? Object.entries(obj).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k))
    : [prefix];

// Plural forms differ per language (Turkish needs only "other"), so compare base keys.
const baseKeys = (obj: unknown) => [...new Set(keysOf(obj).map((k) => k.replace(/_(zero|one|two|few|many|other)$/, '')))].sort();

describe('locales', () => {
  const reference = resources[DEFAULT_LANGUAGE];

  it('has the default language', () => {
    expect(reference).toBeDefined();
  });

  it.each(Object.keys(resources))('%s has the same keys as the default language', (lang) => {
    for (const ns of Object.keys(reference)) {
      expect(baseKeys(resources[lang][ns])).toEqual(baseKeys(reference[ns]));
    }
  });
});
