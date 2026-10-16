import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoadedText } from '../content/loader';
import { displayChunks, orpIndex, rsvpDurations } from '../core/pacing';
import { SpeedControl } from './SpeedControl';

interface Props {
  text: LoadedText;
  initialWpm: number;
  onPauseChange: (paused: boolean) => void;
  onFinish: () => void;
}

/** Şimşek Adası: shows one word at a time in the centre, with the focus letter highlighted. */
export function RsvpReader({ text, initialWpm, onPauseChange, onFinish }: Props) {
  const { t } = useTranslation();
  const chunks = useMemo(() => displayChunks(text.body), [text]);
  const [wpm, setWpm] = useState(initialWpm);
  const durations = useMemo(() => rsvpDurations(chunks, wpm), [chunks, wpm]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => onPauseChange(paused), [paused, onPauseChange]);

  useEffect(() => {
    if (paused) return;
    if (index >= chunks.length) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setIndex((i) => i + 1), durations[index]);
    return () => clearTimeout(timer);
  }, [index, paused, durations, chunks.length, onFinish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const chunk = chunks[Math.min(index, chunks.length - 1)] ?? '';
  const chars = [...chunk];
  const orp = orpIndex(chunk);

  return (
    <>
      <div className="reader-toolbar">
        <SpeedControl value={wpm} onChange={setWpm} />
        <button type="button" className="btn" onClick={() => setPaused(!paused)}>
          {paused ? `▶ ${t('speed.resume')}` : `⏸ ${t('speed.pause')}`}
        </button>
      </div>
      <button type="button" className="rsvp-stage" lang={text.lang} onClick={() => setPaused(!paused)} aria-label={t('speed.tapToPause')}>
        <span className="rsvp-left">{chars.slice(0, orp).join('')}</span>
        <span className="rsvp-focus">{chars[orp]}</span>
        <span className="rsvp-right">{chars.slice(orp + 1).join('')}</span>
      </button>
      <progress className="rsvp-progress" max={chunks.length} value={index} />
      <p className="hint">{t('speed.rsvpHint')}</p>
    </>
  );
}
