import { Award, Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';

export function Celebration({ grand = false }: { grand?: boolean }) {
  return (
    <div className={`celebration ${grand ? 'grand' : ''}`} aria-hidden="true">
      <div className="confetti">
        {Array.from({ length: 22 }, (_, index) => (
          <i key={index} style={{ '--piece': index, '--drift': `${(index % 2 ? 1 : -1) * (20 + index * 3)}px` } as CSSProperties} />
        ))}
      </div>
      <div className="achievement-seal">{grand ? <Trophy strokeWidth={1.6} /> : <Award strokeWidth={1.6} />}</div>
    </div>
  );
}