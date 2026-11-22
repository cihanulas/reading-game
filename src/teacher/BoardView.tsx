import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import type { BoardOp, Box } from '../../ogretmen/src/types';
import { visibleBoard, type BoardItem } from './boardModel';
import { cropFrame } from './cropFrame';
import type { LessonStep } from '../../ogretmen/src/types';

function sanitizeSvg(svg: string): string {
  if (!svg.trim().startsWith('<svg')) return '';
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return '';
  doc.querySelectorAll('script,foreignObject,iframe,object,embed').forEach((node) => node.remove());
  for (const el of doc.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      const value = attr.value.trim().toLowerCase();
      if (attr.name.toLowerCase().startsWith('on') || value.startsWith('javascript:')) el.removeAttribute(attr.name);
    }
  }
  return doc.documentElement.tagName.toLowerCase() === 'svg' ? doc.documentElement.outerHTML : '';
}

function CroppedImage({ src, box, caption }: { src: string; box?: Box; caption?: string }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setSize({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!box) {
    return <figure className="board-image"><img src={src} alt={caption ?? ''} />{caption && <figcaption>{caption}</figcaption>}</figure>;
  }
  const frame = size ? cropFrame(box, size.w, size.h) : null;
  return (
    <figure className="board-image">
      <div
        className="board-crop"
        style={frame ? { aspectRatio: frame.aspectRatio, maxWidth: frame.maxWidthPx } : { minHeight: 48 }}
      >
        <img
          src={src}
          alt={caption ?? ''}
          style={frame ? {
            width: `${frame.image.widthPercent}%`,
            height: `${frame.image.heightPercent}%`,
            left: `${frame.image.leftPercent}%`,
            top: `${frame.image.topPercent}%`,
          } : { visibility: 'hidden' }}
        />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Fraction({ numerator, denominator }: { numerator: number; denominator: number }) {
  const parts = Math.max(1, Math.min(24, denominator));
  const filled = Math.max(0, Math.min(numerator, parts));
  return (
    <div className="fraction-bar" aria-label={`${numerator}/${denominator}`}>
      {Array.from({ length: parts }, (_, index) => <span key={index} className={index < filled ? 'on' : ''} />)}
    </div>
  );
}

function NumberLine({ spec }: { spec: NonNullable<BoardOp['numberline']> }) {
  const span = spec.max - spec.min || 1;
  const x = (value: number) => 4 + ((value - spec.min) / span) * 92;
  return (
    <svg className="numberline" viewBox="0 0 100 36" role="img">
      <line x1="4" y1="20" x2="96" y2="20" stroke="currentColor" strokeWidth="0.8" />
      {(spec.jumps ?? []).map((jump, index) => {
        const from = x(jump.from);
        const to = x(jump.to);
        return (
          <g key={index}>
            <path d={`M ${from} 20 Q ${(from + to) / 2} 6 ${to} 20`} fill="none" stroke="#b5532a" strokeWidth="0.9" />
            {jump.label && <text x={(from + to) / 2} y="8" fontSize="4" textAnchor="middle">{jump.label}</text>}
          </g>
        );
      })}
      <text x="4" y="32" fontSize="4">{spec.min}</text>
      <text x="96" y="32" fontSize="4" textAnchor="end">{spec.max}</text>
    </svg>
  );
}

function marked(text: string, highlight?: string) {
  if (highlight === undefined) return text;
  if (!highlight) return <mark>{text}</mark>;
  const index = text.indexOf(highlight);
  if (index < 0) return <mark>{text}</mark>;
  return <>{text.slice(0, index)}<mark>{highlight}</mark>{text.slice(index + highlight.length)}</>;
}

function ItemView({ item, images }: { item: BoardItem; images: string[] }) {
  const { op, highlight } = item;
  const mark = highlight !== undefined;
  switch (op.op) {
    case 'heading':
      return <h3 className="board-heading">{op.text}</h3>;
    case 'text':
      return <p className={`board-text ${op.style ?? 'normal'} ${mark ? 'marked' : ''}`}>{op.text ? marked(op.text, highlight) : null}</p>;
    case 'bullets':
      return <ul className={mark ? 'marked' : ''}>{(op.items ?? []).map((entry) => <li key={entry}>{entry}</li>)}</ul>;
    case 'math':
      return <p className={`board-math ${mark ? 'marked' : ''}`}>{op.text}</p>;
    case 'emoji':
      return (
        <p className="board-emoji" aria-label={op.label}>
          {Array.from({ length: Math.min(op.count ?? 1, 20) }, (_, index) => <span key={index}>{op.emoji}</span>)}
          {op.label && <small>{op.label}</small>}
        </p>
      );
    case 'image': {
      const src = op.image === undefined ? undefined : images[op.image];
      return src ? <CroppedImage src={src} box={op.box} caption={op.caption} /> : null;
    }
    case 'diagram':
      if (op.kind === 'fraction' && op.fraction) return <Fraction numerator={op.fraction.numerator} denominator={op.fraction.denominator} />;
      if (op.kind === 'numberline' && op.numberline) return <NumberLine spec={op.numberline} />;
      if ((op.kind === 'compare' || op.kind === 'table') && op.columns) {
        return (
          <div className={`diagram diagram-${op.kind}`}>
            {op.columns.map((column) => (
              <div key={column.title}>
                <h4>{column.title}</h4>
                <ul>{column.items.map((entry) => <li key={entry}>{entry}</li>)}</ul>
              </div>
            ))}
          </div>
        );
      }
      return (
        <ol className={`diagram diagram-${op.kind ?? 'flow'}`}>
          {(op.items ?? []).map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}
        </ol>
      );
    case 'svg':
      return op.svg ? <SvgBlock svg={op.svg} /> : null;
    default:
      return null;
  }
}

function SvgBlock({ svg }: { svg: string }) {
  const html = useMemo(() => sanitizeSvg(svg), [svg]);
  if (!html) return null;
  return <div className="board-svg" dangerouslySetInnerHTML={{ __html: html }} />;
}

const ENTER = { appear: { opacity: 0 }, write: { opacity: 0, y: 8 }, pop: { scale: 0.6, opacity: 0 }, slide: { opacity: 0, x: 24 } };

export function BoardView({ steps, upTo, images }: { steps: LessonStep[]; upTo: number; images: string[] }) {
  const items = visibleBoard(steps, upTo);
  return (
    <div className="board" aria-live="polite">
      {items.map((item) => (
        <motion.div
          key={item.key}
          initial={ENTER[item.op.anim ?? 'appear']}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <ItemView item={item} images={images} />
        </motion.div>
      ))}
    </div>
  );
}
