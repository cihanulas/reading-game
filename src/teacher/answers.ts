import { getLanguagePack, isLangCode } from '../lang';

export function answersMatch(lang: string, given: string, accepted: string[]): boolean {
  const normalize = isLangCode(lang)
    ? (value: string) => getLanguagePack(lang).normalize(value)
    : (value: string) => value.trim().toLocaleLowerCase();
  const guess = normalize(given);
  return accepted.some((answer) => normalize(answer) === guess);
}
