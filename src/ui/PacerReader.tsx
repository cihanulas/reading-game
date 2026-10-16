import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoadedText } from '../content/loader';
import { groupLines, msPerWord } from '../core/pacing';
import { ReadingBody } from './ReadingBody';
import { SpeedControl } from './SpeedControl';

interface Props {
  text: LoadedText;
  initialWpm: number;
  onPauseChange: (paused: boolean) => void;
  onFinish: () => void;
}

interface Line {
  start: number;
  end: number;
  words: number;
}

const HAS_WORD = /[\p{L}\p{N}]/u;

/** Rüzgâr Adası: highlights the text line by line at the chosen speed; read lines fade out. */
export function PacerReader({ text, initialWpm, onPauseChange, onFinish }: Props) {
  const { t } = useTranslation();
  const [wpm, setWpm] = useState(initialWpm);
  const [lines, setLines] = useState<Line[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const paused = userPaused || glossaryOpen;

  const measure = useCallback(() => {
    const spans = articleRef.current ? [...articleRef.current.querySelectorAll<HTMLElement>('[data-word]')] : [];
    const ranges = groupLines(spans.map((s) => s.offsetTop));
    setLines(
      ranges.map(([start, end]) => ({
        start,
        end,
        words: Math.max(1, spans.slice(start, end).filter((s) => HAS_WORD.test(s.textContent ?? '')).length),
      })),
    );
  }, []);

  useLayoutEffect(() => {
    measure();
    const article = articleRef.current;
    if (!article) return;
    const observer = new ResizeObserver(measure);
    observer.observe(article);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => onPauseChange(paused), [paused, onPauseChange]);

  useEffect(() => {
    if (lines.length === 0 || paused) return;
    if (lineIndex >= lines.length) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setLineIndex((i) => i + 1), lines[lineIndex].words * msPerWord(wpm));
    return () => clearTimeout(timer);
  }, [lines, lineIndex, paused, wpm, onFinish]);

  useEffect(() => {
    const line = lines[lineIndex];
    const span = line && articleRef.current?.querySelectorAll<HTMLElement>('[data-word]')[line.start];
    span?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [lines, lineIndex]);

  const current = lines[lineIndex];
  const wordClassName = (i: number) => {
    if (!current) return lineIndex > 0 ? 'pacer-done' : undefined;
    if (i < current.start) return 'pacer-done';
    if (i < current.end) return 'pacer-current';
    return undefined;
  };

  return (
    <>
      <div className="reader-toolbar">
        <SpeedControl value={wpm} onChange={setWpm} />
        <button type="button" className="btn" onClick={() => setUserPaused(!userPaused)}>
          {userPaused ? `▶ ${t('speed.resume')}` : `⏸ ${t('speed.pause')}`}
        </button>
      </div>
      <ReadingBody text={text} onGlossaryToggle={setGlossaryOpen} wordClassName={wordClassName} articleRef={articleRef} />
    </>
  );
}
