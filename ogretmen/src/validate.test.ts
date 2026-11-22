import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateContract, type ContractName } from './validate.ts';
import type { Lesson, Quiz } from './types.ts';

const example = <T>(name: string): T =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'ornekler', `${name}.json`), 'utf8')) as T;

describe('öğretmen sözleşmeleri', () => {
  it.each<ContractName>(['source', 'lesson', 'quiz', 'answer'])('ornekler/%s.json geçerli', (name) => {
    expect(validateContract(name, example(name), { imageCount: 1 })).toEqual([]);
  });

  it('resim yokken image komutunu reddeder', () => {
    const errors = validateContract('lesson', example('lesson'), { imageCount: 0 });
    expect(errors.some((e) => e.includes('image 0 yok'))).toBe(true);
  });

  it('op için zorunlu alanı ve olmayan hedefi yakalar', () => {
    const lesson = example<Lesson>('lesson');
    lesson.scenes[0].steps[0].board = [
      { op: 'text', text: 'kimliksiz' },
      { op: 'highlight', target: 'yok' },
      { op: 'diagram', id: 'd9', kind: 'cycle' },
    ];
    const errors = validateContract('lesson', lesson, { imageCount: 1 });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"text" için "id" zorunlu'),
        expect.stringContaining('hedef "yok" tahtada yok'),
        expect.stringContaining('"cycle" diyagramı için "items" zorunlu'),
      ]),
    );
  });

  it('svg içinde script ve olay özniteliğini reddeder', () => {
    const lesson = example<Lesson>('lesson');
    lesson.scenes[0].steps[0].board = [{ op: 'svg', id: 'x', svg: '<svg onload="alert(1)"></svg>' }];
    expect(validateContract('lesson', lesson, { imageCount: 1 }).join()).toContain('svg script');
  });

  it('şema dışı alanı ve eksik zorunlu alanı reddeder', () => {
    const lesson = { ...example<Lesson>('lesson'), extra: 1 } as Record<string, unknown>;
    delete lesson.recap;
    const errors = validateContract('lesson', lesson);
    expect(errors.join()).toContain('recap');
    expect(errors.join()).toContain('additional');
  });

  it('soru türüne göre cevap alanını ister', () => {
    const quiz = example<Quiz>('quiz');
    delete quiz.questions[0].answerIndex;
    quiz.questions[2].prompt = 'Boşluk yok';
    const errors = validateContract('quiz', quiz);
    expect(errors.join()).toContain('answerIndex zorunlu');
    expect(errors.join()).toContain('"___"');
  });
});
