/** Display helpers for the guided (pacer) and RSVP reading modes. */

export const MIN_WPM = 60;
export const MAX_WPM = 800;
export const WPM_STEP = 10;

export const clampWpm = (wpm: number) => Math.min(Math.max(Math.round(wpm / WPM_STEP) * WPM_STEP, MIN_WPM), MAX_WPM);

export const msPerWord = (wpm: number) => 60_000 / wpm;

const HAS_WORD = /[\p{L}\p{N}]/u;
const SENTENCE_END = /[.!?…]["'”’»)]*$/u;
const CLAUSE_END = /[,;:]["'”’»)]*$/u;

/** Splits text into display chunks (whitespace separated), dropping pure punctuation like "—". */
export function displayChunks(body: string): string[] {
  return body.split(/\s+/).filter((c) => HAS_WORD.test(c));
}

/** Relative time weight of an RSVP chunk: longer words and punctuation get more time. */
export function chunkWeight(chunk: string): number {
  let w = 1;
  if ([...chunk].length > 8) w += 0.3;
  if (SENTENCE_END.test(chunk)) w += 1;
  else if (CLAUSE_END.test(chunk)) w += 0.5;
  return w;
}

/** Per-chunk durations whose sum equals chunks × msPerWord(wpm), so average pace matches wpm. */
export function rsvpDurations(chunks: string[], wpm: number): number[] {
  const weights = chunks.map(chunkWeight);
  const total = weights.reduce((a, b) => a + b, 0);
  const budget = chunks.length * msPerWord(wpm);
  return weights.map((w) => (w / total) * budget);
}

/** Optimal recognition point: index (in code points) of the letter the eye should fixate. */
export function orpIndex(chunk: string): number {
  const chars = [...chunk];
  const start = chars.findIndex((c) => HAS_WORD.test(c));
  if (start < 0) return 0;
  const letters = chars.slice(start).filter((c) => HAS_WORD.test(c)).length;
  const offset = letters <= 1 ? 0 : letters <= 5 ? 1 : letters <= 9 ? 2 : letters <= 13 ? 3 : 4;
  return start + offset;
}

/** Groups consecutive items with the same vertical position into lines: [start, end) index ranges. */
export function groupLines(tops: number[]): [number, number][] {
  const lines: [number, number][] = [];
  let start = 0;
  for (let i = 1; i <= tops.length; i++) {
    if (i === tops.length || Math.abs(tops[i] - tops[start]) > 2) {
      if (i > start) lines.push([start, i]);
      start = i;
    }
  }
  return lines;
}
