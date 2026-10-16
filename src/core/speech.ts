/** Aligning speech-recognition output with the text being read aloud (Yankı Mağarası). */

export interface Alignment {
  /** Per target word: was it heard? Punctuation-only targets ('') count as heard once passed. */
  matched: boolean[];
  /** Index of the next target word to be read. */
  cursor: number;
  /** Heard words that matched nothing nearby (repetitions, misreads). */
  extra: number;
  /** Target words passed over without being heard. */
  skipped: number;
}

/** How many upcoming words a heard word may match, so a short skip does not lose the reader. */
export const LOOKAHEAD = 5;

export function editDistance(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let prev = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[y.length];
}

/** Lenient comparison of two normalized words: recognizers often slip a letter or a suffix. */
export function wordsMatch(heard: string, target: string): boolean {
  if (heard === target) return true;
  const shorter = Math.min([...heard].length, [...target].length);
  if (shorter < 4) return false;
  return editDistance(heard, target) <= (shorter >= 7 ? 2 : 1);
}

/** Greedy left-to-right alignment of normalized heard words against normalized target words. */
export function alignTranscript(target: readonly string[], heard: readonly string[]): Alignment {
  const matched = target.map(() => false);
  let cursor = 0;
  let extra = 0;

  const passEmpty = () => {
    while (cursor < target.length && target[cursor] === '') matched[cursor++] = true;
  };
  const nextWord = (from: number) => {
    let j = from;
    while (j < target.length && target[j] === '') j++;
    return j < target.length ? j : -1;
  };

  passEmpty();
  for (const word of heard) {
    if (!word) continue;
    let hit = -1;
    let last = -1;
    for (let j = nextWord(cursor), seen = 0; j >= 0 && seen < LOOKAHEAD; j = nextWord(j + 1), seen++) {
      if (wordsMatch(word, target[j])) {
        hit = last = j;
        break;
      }
      // "birşey" heard for "bir şey"
      const k = nextWord(j + 1);
      if (k >= 0 && word === target[j] + target[k]) {
        hit = j;
        last = k;
        break;
      }
    }
    if (hit < 0) {
      extra++;
      continue;
    }
    matched[hit] = matched[last] = true;
    cursor = last + 1;
    passEmpty();
  }

  let skipped = 0;
  for (let i = 0; i < cursor; i++) {
    if (target[i] === '') matched[i] = true;
    else if (!matched[i]) skipped++;
  }
  return { matched, cursor, extra, skipped };
}
