import { Ajv, type ErrorObject } from 'ajv';
import { answerSchema, lessonSchema, quizSchema, sourceSchema } from './schemas.ts';
import type {
  BoardOp,
  BoardOpName,
  Lesson,
  LessonStep,
  Quiz,
  SourceDoc,
  TutorAnswer,
} from './types.ts';

const ajv = new Ajv({ allErrors: true, strict: false });

const compiled = {
  source: ajv.compile(sourceSchema),
  lesson: ajv.compile(lessonSchema),
  quiz: ajv.compile(quizSchema),
  answer: ajv.compile(answerSchema),
};

export type ContractName = keyof typeof compiled;

/** Her tahta komutunun zorunlu alanları; şema bunları `op`'a göre ayıramaz. */
export const BOARD_OP_REQUIRED: Record<BoardOpName, (keyof BoardOp)[]> = {
  clear: [],
  heading: ['text'],
  text: ['id', 'text'],
  bullets: ['id', 'items'],
  math: ['id', 'text'],
  highlight: ['target'],
  remove: ['target'],
  image: ['id', 'image'],
  emoji: ['id', 'emoji'],
  diagram: ['id', 'kind'],
  svg: ['id', 'svg'],
};

const DIAGRAM_REQUIRED: Record<string, keyof BoardOp> = {
  flow: 'items',
  cycle: 'items',
  timeline: 'items',
  compare: 'columns',
  table: 'columns',
  numberline: 'numberline',
  fraction: 'fraction',
};

function formatAjv(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message ?? 'geçersiz'}`);
}

export interface ValidateOptions {
  /** Girdi resim sayısı; image komutları ve bölgeler bu sınırı aşamaz. */
  imageCount?: number;
}

function checkBox(path: string, b: { x: number; y: number; w: number; h: number }, out: string[]) {
  if (b.w <= 0 || b.h <= 0) out.push(`${path}/box genişlik ve yükseklik sıfırdan büyük olmalı`);
  if (b.x + b.w > 1.001 || b.y + b.h > 1.001) out.push(`${path}/box resmin dışına taşıyor`);
}

function checkSteps(path: string, steps: LessonStep[], ids: Set<string>, opts: ValidateOptions, out: string[]) {
  steps.forEach((step, si) => {
    const sp = `${path}/steps/${si}`;
    (step.board ?? []).forEach((op, oi) => {
      const p = `${sp}/board/${oi}`;
      for (const field of BOARD_OP_REQUIRED[op.op] ?? []) {
        if (op[field] === undefined) out.push(`${p} "${op.op}" için "${field}" zorunlu`);
      }
      if (op.op === 'clear') ids.clear();
      if (op.id) {
        if (ids.has(op.id)) out.push(`${p} id "${op.id}" sahnede zaten var`);
        ids.add(op.id);
      }
      if (op.target && !ids.has(op.target)) {
        out.push(`${p} hedef "${op.target}" tahtada yok`);
      }
      if (op.op === 'remove' && op.target) ids.delete(op.target);
      if (op.op === 'diagram' && op.kind) {
        const need = DIAGRAM_REQUIRED[op.kind];
        if (need && op[need] === undefined) out.push(`${p} "${op.kind}" diyagramı için "${need}" zorunlu`);
      }
      if (op.op === 'image' && op.image !== undefined) {
        if (opts.imageCount === undefined || op.image >= opts.imageCount) {
          out.push(`${p} image ${op.image} yok (girdi resim sayısı: ${opts.imageCount ?? 0})`);
        }
      }
      if (op.box) checkBox(p, op.box, out);
      if (op.fraction && op.fraction.numerator > op.fraction.denominator * 3) {
        out.push(`${p} kesir çizilemeyecek kadar büyük`);
      }
      if (op.numberline && op.numberline.max <= op.numberline.min) {
        out.push(`${p} sayı doğrusu max > min olmalı`);
      }
      if (op.svg && /<script|on\w+\s*=|javascript:|<foreignObject/i.test(op.svg)) {
        out.push(`${p} svg script, olay özniteliği veya foreignObject içeremez`);
      }
    });
    if (step.check && step.check.answerIndex >= step.check.choices.length) {
      out.push(`${sp}/check answerIndex seçenek sayısını aşıyor`);
    }
  });
}

function semanticSource(doc: SourceDoc, opts: ValidateOptions, out: string[]) {
  const ids = new Set<string>();
  doc.regions.forEach((r, i) => {
    if (ids.has(r.id)) out.push(`/regions/${i} id "${r.id}" tekrar ediyor`);
    ids.add(r.id);
    if (opts.imageCount !== undefined && r.image >= opts.imageCount) {
      out.push(`/regions/${i} image ${r.image} yok (girdi resim sayısı: ${opts.imageCount})`);
    }
    checkBox(`/regions/${i}`, r.box, out);
  });
  doc.exercises.forEach((e, i) => {
    if (e.regionId && !ids.has(e.regionId)) out.push(`/exercises/${i} regionId "${e.regionId}" yok`);
  });
}

function semanticLesson(lesson: Lesson, opts: ValidateOptions, out: string[]) {
  const sceneIds = new Set<string>();
  lesson.scenes.forEach((scene, i) => {
    if (sceneIds.has(scene.id)) out.push(`/scenes/${i} id "${scene.id}" tekrar ediyor`);
    sceneIds.add(scene.id);
    checkSteps(`/scenes/${i}`, scene.steps, new Set(), opts, out);
  });
}

function semanticQuiz(quiz: Quiz, out: string[]) {
  const ids = new Set<string>();
  quiz.questions.forEach((q, i) => {
    const p = `/questions/${i}`;
    if (ids.has(q.id)) out.push(`${p} id "${q.id}" tekrar ediyor`);
    ids.add(q.id);
    switch (q.type) {
      case 'multiple_choice':
        if (!q.choices || q.answerIndex === undefined) out.push(`${p} choices ve answerIndex zorunlu`);
        else if (q.answerIndex >= q.choices.length) out.push(`${p} answerIndex seçenek sayısını aşıyor`);
        break;
      case 'true_false':
        if (q.answerBool === undefined) out.push(`${p} answerBool zorunlu`);
        break;
      case 'short_answer':
      case 'fill_blank':
        if (!q.acceptedAnswers) out.push(`${p} acceptedAnswers zorunlu`);
        if (q.type === 'fill_blank' && !q.prompt.includes('___')) out.push(`${p} boşluk "___" ile gösterilmeli`);
        break;
      case 'ordering':
        if (!q.orderedItems) out.push(`${p} orderedItems zorunlu`);
        break;
    }
  });
}

/**
 * Sözleşmeye uygunluğu denetler. Boş dizi = geçerli. Hata metinleri ajana
 * geri gönderilir, bu yüzden kısa ve düzeltilebilir olmalıdır.
 */
export function validateContract(name: ContractName, data: unknown, opts: ValidateOptions = {}): string[] {
  const validator = compiled[name];
  if (!validator(data)) return formatAjv(validator.errors);
  const out: string[] = [];
  if (name === 'source') semanticSource(data as SourceDoc, opts, out);
  if (name === 'lesson') semanticLesson(data as Lesson, opts, out);
  if (name === 'quiz') semanticQuiz(data as Quiz, out);
  if (name === 'answer') checkSteps('', (data as TutorAnswer).steps, new Set(), opts, out);
  return out;
}
