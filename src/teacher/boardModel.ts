import type { BoardOp, LessonStep } from '../../ogretmen/src/types';

export interface BoardItem {
  key: string;
  op: BoardOp;
  /** Vurgulanacak ifade. Boş dize, öğenin tamamını vurgular. */
  highlight?: string;
}

/** Bir sahnenin başından `upTo` adımına kadar tahtada görünen öğeler. */
export function visibleBoard(steps: LessonStep[], upTo: number): BoardItem[] {
  const items: BoardItem[] = [];
  let serial = 0;
  const last = Math.min(upTo, steps.length - 1);
  for (let i = 0; i <= last; i++) {
    for (const op of steps[i]?.board ?? []) {
      if (op.op === 'clear') {
        items.length = 0;
        continue;
      }
      if (op.op === 'remove' && op.target) {
        const index = items.findIndex((item) => item.op.id === op.target);
        if (index >= 0) items.splice(index, 1);
        continue;
      }
      if (op.op === 'highlight' && op.target) {
        const item = items.find((candidate) => candidate.op.id === op.target);
        if (item) item.highlight = op.text ?? '';
        continue;
      }
      items.push({ key: op.id ?? `n${serial++}`, op });
    }
  }
  return items;
}
