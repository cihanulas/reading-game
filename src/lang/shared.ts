// Letters/digits, optionally joined by an apostrophe suffix (e.g. "Hasan'la") or hyphen.
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

export function unicodeTokenize(text: string): string[] {
  return text.match(WORD_PATTERN) ?? [];
}

export function stripPunctuation(word: string): string {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}
