import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoadedText } from '../content/loader';
import { alignTranscript, type Alignment } from '../core/speech';
import { getLanguagePack, type LangCode } from '../lang';
import { ReadingBody } from './ReadingBody';
import { getRecognition, type Recognition, type RecognitionResultEvent } from './speechRecognition';

export interface VoiceStats {
  /** Words heard correctly. */
  matched: number;
  /** Words in the text. */
  total: number;
  /** Skipped plus unexpected words. */
  stumbles: number;
}

interface Props {
  text: LoadedText;
  onPauseChange: (paused: boolean) => void;
  onFinish: (stats: VoiceStats) => void;
}

type Problem = 'permission' | 'network' | null;

const HAS_WORD = /[\p{L}\p{N}]/u;

/**
 * Yankı Mağarası: follows the reader's voice word by word.
 * Audio goes only to the browser's speech service; the app never records or stores it.
 */
export function VoiceReader({ text, onPauseChange, onFinish }: Props) {
  const { t } = useTranslation();
  const pack = getLanguagePack(text.lang as LangCode);
  const target = useMemo(
    () => text.body.split(/\s+/).filter(Boolean).map((w) => (HAS_WORD.test(w) ? pack.normalize(w) : '')),
    [text, pack],
  );
  const [alignment, setAlignment] = useState<Alignment>(() => alignTranscript(target, []));
  const [paused, setPaused] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const finalWords = useRef<string[]>([]);
  const latest = useRef(alignment);
  const done = useRef(false);
  const articleRef = useRef<HTMLElement>(null);
  const listening = !paused && !glossaryOpen && problem === null;

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    const a = latest.current;
    const words = target.filter(Boolean).length;
    const matched = a.matched.filter((m, i) => m && target[i] !== '').length;
    onFinish({ matched, total: words, stumbles: a.skipped + a.extra });
  }, [target, onFinish]);

  useEffect(() => onPauseChange(!listening), [listening, onPauseChange]);

  useEffect(() => {
    const Ctor = getRecognition();
    if (!Ctor || !listening) return;
    const rec: Recognition = new Ctor();
    let active = true;
    rec.lang = pack.speechLocale;
    rec.continuous = true;
    rec.interimResults = true;

    const split = (s: string) => s.split(/\s+/).map((w) => pack.normalize(w)).filter(Boolean);

    rec.onresult = (e: RecognitionResultEvent) => {
      const interim: string[] = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const words = split(r[0]?.transcript ?? '');
        if (r.isFinal) finalWords.current.push(...words);
        else interim.push(...words);
      }
      const a = alignTranscript(target, [...finalWords.current, ...interim]);
      latest.current = a;
      setAlignment(a);
      if (a.cursor >= target.length) finish();
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') setProblem('permission');
      else if (e.error === 'network') setProblem('network');
    };
    // Chrome ends a session after a silence; keep listening until paused or finished.
    rec.onend = () => {
      if (active && !done.current) {
        try {
          rec.start();
        } catch {
          /* already restarting */
        }
      }
    };
    rec.start();
    return () => {
      active = false;
      rec.onend = null;
      rec.abort();
    };
  }, [listening, target, pack, finish]);

  useEffect(() => {
    const span = articleRef.current?.querySelectorAll<HTMLElement>('[data-word]')[alignment.cursor];
    span?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [alignment.cursor]);

  const wordClassName = (i: number) => {
    if (alignment.matched[i]) return 'voice-read';
    if (i < alignment.cursor) return 'voice-skipped';
    if (i === alignment.cursor) return 'voice-current';
    return undefined;
  };

  const progress = target.length ? Math.round((alignment.cursor / target.length) * 100) : 0;

  return (
    <>
      <div className="reader-toolbar">
        <span className={`mic ${listening ? 'on' : ''}`} aria-live="polite">
          {listening ? `🎙️ ${t('voice.listening')}` : `🔇 ${t('voice.notListening')}`}
        </span>
        <button type="button" className="btn" onClick={() => setPaused(!paused)} disabled={problem !== null}>
          {paused ? `▶ ${t('speed.resume')}` : `⏸ ${t('speed.pause')}`}
        </button>
        <button type="button" className="btn primary" onClick={finish}>
          {t('reading.finish')}
        </button>
      </div>
      <progress className="rsvp-progress" max={100} value={progress} />
      {problem && (
        <p className="speech" role="alert">
          🦜 {t(problem === 'permission' ? 'voice.permission' : 'voice.network')}
        </p>
      )}
      <ReadingBody text={text} onGlossaryToggle={setGlossaryOpen} wordClassName={wordClassName} articleRef={articleRef} />
    </>
  );
}
