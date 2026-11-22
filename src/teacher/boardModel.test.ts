import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Lesson } from '../../ogretmen/src/types';
import { visibleBoard } from './boardModel';

const lesson = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../ogretmen/ornekler/lesson.json'), 'utf8'),
) as Lesson;

describe('visibleBoard', () => {
  it('kaldırılan öğeyi tahtadan siler', () => {
    const scene = lesson.scenes[0];
    const board = visibleBoard(scene.steps, 2);
    expect(board.map((item) => item.op.id)).not.toContain('e1');
    expect(board.map((item) => item.op.id)).toContain('f1');
  });

  it('vurguyu hedef öğeye yazar', () => {
    const scene = lesson.scenes[1];
    const board = visibleBoard(scene.steps, 1);
    const math = board.find((item) => item.op.id === 'm1');
    expect(math?.highlight).toBe('4');
  });

  it('clear sonrasında önceki öğeleri tutmaz', () => {
    const board = visibleBoard(
      [
        { say: 'a', board: [{ op: 'text', id: 'eski', text: 'silinecek' }] },
        { say: 'b', board: [{ op: 'clear' }, { op: 'text', id: 'yeni', text: 'kaldı' }] },
      ],
      1,
    );
    expect(board.map((item) => item.op.id)).toEqual(['yeni']);
  });
});
