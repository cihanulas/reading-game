import { useCallback, useRef, useState, type ReactNode } from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LoadedText } from '../content/loader';
import { clampWpm } from '../core/pacing';
import { Stopwatch } from '../core/stopwatch';
import { PacerReader } from './PacerReader';
import { QuestionCard } from './QuestionCard';
import { ReadingBody } from './ReadingBody';
import { RsvpReader } from './RsvpReader';
import { SpeedControl } from './SpeedControl';
import { VoiceReader, type VoiceStats } from './VoiceReader';

type Phase = 'ready' | 'reading' | 'questions';

/** How the text is presented: free silent reading, line pacer, one word at a time, or read aloud. */
export type Presentation = 'free' | 'pacer' | 'rsvp' | 'voice';

export interface RunResult {
  activeMs: number;
  correct: number;
  total: number;
  /** Only for read-aloud runs. */
  voice?: VoiceStats;
}

interface Props {
  text: LoadedText;
  header?: ReactNode;
  presentation?: Presentation;
  /** Starting speed for pacer/RSVP. */
  wpm?: number;
  onComplete: (result: RunResult) => void | Promise<void>;
  onExit: () => void;
}

const DEFAULT_WPM = 150;

/** One text: ready screen → timed reading (pauses excluded) → questions. */
export function ReadingRun({ text, header, presentation = 'free', wpm: targetWpm, onComplete, onExit }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('ready');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wpm, setWpm] = useState(clampWpm(targetWpm ?? DEFAULT_WPM));
  const correct = useRef(0);
  const activeMs = useRef(0);
  const voiceStats = useRef<VoiceStats | undefined>(undefined);
  const stopwatch = useRef(new Stopwatch());
  const submitted = useRef(false);
  const finalResult = useRef<RunResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const exit = () => {
    const running = stopwatch.current.running;
    stopwatch.current.pause();
    if (phase === 'ready' || window.confirm(t('reading.exitConfirm'))) onExit();
    else if (running) stopwatch.current.start();
  };

  const runHeader = (
    <div className="run-header">
      <div>{header}</div>
      <button type="button" className="btn ghost" onClick={exit} disabled={saving}>
        <LogOut size={18} aria-hidden="true" /> {t('reading.exit')}
      </button>
    </div>
  );

  const save = async () => {
    if (submitted.current || !finalResult.current) return;
    submitted.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await onComplete(finalResult.current);
    } catch {
      submitted.current = false;
      setSaveError(true);
      setSaving(false);
    }
  };

  const startReading = () => {
    stopwatch.current.reset();
    stopwatch.current.start();
    setPhase('reading');
  };

  const finishReading = useCallback(() => {
    stopwatch.current.pause();
    activeMs.current = stopwatch.current.elapsedMs;
    correct.current = 0;
    setQuestionIndex(0);
    setPhase('questions');
    window.scrollTo(0, 0);
  }, []);

  const onPauseChange = useCallback((paused: boolean) => (paused ? stopwatch.current.pause() : stopwatch.current.start()), []);

  const finishVoice = useCallback(
    (stats: VoiceStats) => {
      voiceStats.current = stats;
      finishReading();
    },
    [finishReading],
  );

  const onQuestionDone = (isCorrect: boolean) => {
    if (finalResult.current) return;
    if (isCorrect) correct.current++;
    if (questionIndex + 1 < text.questions.length) {
      setQuestionIndex(questionIndex + 1);
      return;
    }
    finalResult.current = { activeMs: activeMs.current, correct: correct.current, total: text.questions.length, voice: voiceStats.current };
    void save();
  };

  if (phase === 'ready') {
    return (
      <section className="screen">
        <div className="card">
          {runHeader}
          <h2>{text.title}</h2>
          <p className="byline">{text.author}</p>
          {presentation === 'free' && <p className="hint">{t('reading.glossaryHint')}</p>}
          {presentation === 'pacer' && <p className="hint">{t('speed.pacerHint')}</p>}
          {presentation === 'rsvp' && <p className="hint">{t('speed.rsvpIntro')}</p>}
          {presentation === 'voice' && (
            <>
              <p className="hint">{t('voice.intro')}</p>
              <p className="hint">🔒 {t('voice.privacy')}</p>
            </>
          )}
          {(presentation === 'pacer' || presentation === 'rsvp') && (
            <>
              <p>
                <strong>{t('speed.choose')}</strong>
              </p>
              <SpeedControl value={wpm} onChange={setWpm} />
            </>
          )}
          <button type="button" className="btn primary big" onClick={startReading}>
            {t('reading.start')}
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'reading') {
    return (
      <section className="screen reading">
        <div className="card">
          {runHeader}
          <h2>{text.title}</h2>
          <p className="byline">
            {text.author}
            {text.simplified && <> · {t('reading.simplified')}</>}
          </p>
          {presentation === 'free' && (
            <>
              <ReadingBody text={text} onGlossaryToggle={onPauseChange} />
              <button type="button" className="btn primary big" onClick={finishReading}>
                {t('reading.finish')}
              </button>
            </>
          )}
          {presentation === 'pacer' && (
            <PacerReader text={text} initialWpm={wpm} onPauseChange={onPauseChange} onFinish={finishReading} />
          )}
          {presentation === 'rsvp' && (
            <RsvpReader text={text} initialWpm={wpm} onPauseChange={onPauseChange} onFinish={finishReading} />
          )}
          {presentation === 'voice' && <VoiceReader text={text} onPauseChange={onPauseChange} onFinish={finishVoice} />}
        </div>
      </section>
    );
  }

  const question = text.questions[questionIndex];
  return (
    <section className="screen">
      {runHeader}
      <h2>{t('reading.questionsTitle')}</h2>
      <p className="question-progress">{t('reading.questionProgress', { current: questionIndex + 1, total: text.questions.length })}</p>
      <progress className="rsvp-progress" value={questionIndex + 1} max={text.questions.length} aria-label={t('reading.questionsTitle')} />
      {saving ? <p role="status">{t('reading.saving')}</p> : saveError ? (
        <div role="alert" className="speech">
          <p>{t('reading.saveError')}</p>
          <button type="button" className="btn primary" onClick={() => void save()}><RotateCcw size={18} aria-hidden="true" /> {t('reading.retry')}</button>
        </div>
      ) : <QuestionCard key={`${text.id}-${question.id}`} question={question} onDone={onQuestionDone} />}
    </section>
  );
}
