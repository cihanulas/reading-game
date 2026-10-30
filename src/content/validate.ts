import { AGE_GROUPS, getLanguagePack, isLangCode } from '../lang';
import { MAX_LEVEL, PLACEMENT_LEVEL, type Question, type ReadingText } from './schema';

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 5;

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Validates a content file; `path` is like `/content/tr/10-13/placement/x.json`. Returns error messages. */
export function validateReadingText(data: unknown, path: string): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${path}: ${msg}`);
  const t = data as Partial<ReadingText>;

  for (const key of ['id', 'lang', 'title', 'author', 'source', 'body'] as const) {
    if (!isNonEmptyString(t[key])) err(`"${key}" boş olamaz`);
  }
  if (errors.length) return errors;

  if (!isLangCode(t.lang!)) {
    err(`desteklenmeyen dil "${t.lang}"`);
    return errors;
  }
  if (!AGE_GROUPS.includes(t.ageGroup!)) err(`geçersiz yaş grubu "${t.ageGroup}"`);
  if (!Number.isInteger(t.level) || t.level! < PLACEMENT_LEVEL || t.level! > MAX_LEVEL) err(`geçersiz seviye "${t.level}"`);
  if (typeof t.simplified !== 'boolean') err('"simplified" true/false olmalı');
  if (t.activity !== undefined && (!['detective', 'discovery'].includes(t.activity) || t.level !== MAX_LEVEL)) err('ek aktivite türü geçersiz veya son seviyede değil');

  const segments = path.split('/');
  const [lang, age, levelDir] = segments.slice(segments.indexOf('content') + 1);
  const expectedLevelDir = t.level === PLACEMENT_LEVEL ? 'placement' : `level-${t.level}`;
  if (lang !== t.lang || age !== t.ageGroup || levelDir !== expectedLevelDir) {
    err(`klasör yolu içerikle uyuşmuyor (beklenen ${t.lang}/${t.ageGroup}/${expectedLevelDir})`);
  }

  const pack = getLanguagePack(t.lang);
  const bodyWords = new Set(pack.tokenize(t.body!).map(pack.normalize));
  const appearsInBody = (word: string) => {
    const w = pack.normalize(word);
    for (const b of bodyWords) if (b.startsWith(w)) return true;
    return false;
  };

  if (!Array.isArray(t.glossary)) err('"glossary" dizi olmalı');
  else {
    for (const g of t.glossary) {
      if (!isNonEmptyString(g.word) || !isNonEmptyString(g.meaning)) err('sözlük girdisi eksik');
      else if (pack.tokenize(g.word).length !== 1) err(`sözlük kelimesi tek kelime olmalı: "${g.word}"`);
      else if (!bodyWords.has(pack.normalize(g.word))) err(`sözlük kelimesi metinde yok: "${g.word}"`);
    }
  }

  if (!Array.isArray(t.questions)) {
    err('"questions" dizi olmalı');
    return errors;
  }
  if (t.questions.length < MIN_QUESTIONS || t.questions.length > MAX_QUESTIONS) {
    err(`${MIN_QUESTIONS}-${MAX_QUESTIONS} soru olmalı, ${t.questions.length} var`);
  }
  const ids = new Set<string>();
  for (const q of t.questions) {
    if (!isNonEmptyString(q.id) || ids.has(q.id)) err(`soru kimliği boş veya tekrar: "${q.id}"`);
    ids.add(q.id);
    if (!isNonEmptyString(q.prompt)) err(`${q.id}: soru metni boş`);
    validateQuestion(q, (m) => err(`${q.id}: ${m}`), appearsInBody);
  }
  return errors;
}

function validateQuestion(q: Question, err: (m: string) => void, appearsInBody: (w: string) => boolean) {
  switch (q.type) {
    case 'multipleChoice':
    case 'wordRecall':
      if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every(isNonEmptyString)) {
        err('en az 2 seçenek olmalı');
        return;
      }
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err('cevap indeksi geçersiz');
      if (q.type === 'wordRecall') {
        q.options.forEach((o, i) => {
          if (i === q.answer && !appearsInBody(o)) err(`doğru kelime metinde yok: "${o}"`);
          if (i !== q.answer && appearsInBody(o)) err(`yanlış seçenek metinde geçiyor: "${o}"`);
        });
      }
      return;
    case 'trueFalse':
      if (typeof q.answer !== 'boolean') err('cevap true/false olmalı');
      return;
    case 'ordering':
      if (!Array.isArray(q.items) || q.items.length < 3 || !q.items.every(isNonEmptyString)) err('en az 3 madde olmalı');
      return;
    default:
      err(`bilinmeyen soru tipi "${(q as { type: string }).type}"`);
  }
}
