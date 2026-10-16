import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoadedText } from '../content/loader';
import { Stopwatch } from '../core/stopwatch';
import { QuestionCard } from './QuestionCard';
import { ReadingBody } from './ReadingBody';

type Phase = 'ready' | 'reading' | 'questions';

export interface RunResult {
  activeMs: number;
  correct: number;
  total: number;
}

interface Props {
  text: LoadedText;
  header?: ReactNode;
  onComplete: (result: RunResult) => void;
}

/** One text: ready screen → timed reading (pauses for glossary) → questions. */
export function ReadingRun({ text, header, onComplete }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('ready');
  const [questionIndex, setQuestionIndex] = useState(0);
  const correct = useRef(0);
  const activeMs = useRef(0);
  const stopwatch = useRef(new Stopwatch());

  const startReading = () => {
    stopwatch.current.reset();
    stopwatch.current.start();
    setPhase('reading');
  };

  const finishReading = () => {
    stopwatch.current.pause();
    activeMs.current = stopwatch.current.elapsedMs;
    correct.current = 0;
    setQuestionIndex(0);
    setPhase('questions');
    window.scrollTo(0, 0);
  };

  const onGlossaryToggle = (open: boolean) => (open ? stopwatch.current.pause() : stopwatch.current.start());

  const onQuestionDone = (isCorrect: boolean) => {
    if (isCorrect) correct.current++;
    if (questionIndex + 1 < text.questions.length) {
      setQuestionIndex(questionIndex + 1);
      return;
    }
    onComplete({ activeMs: activeMs.current, correct: correct.current, total: text.questions.length });
  };

  if (phase === 'ready') {
    return (
      <section className="screen">
        <div className="card">
          {header}
          <h2>{text.title}</h2>
          <p className="byline">{text.author}</p>
          <p className="hint">{t('reading.glossaryHint')}</p>
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
          {header}
          <h2>{text.title}</h2>
          <p className="byline">
            {text.author}
            {text.simplified && <> · {t('reading.simplified')}</>}
          </p>
          <ReadingBody text={text} onGlossaryToggle={onGlossaryToggle} />
          <button type="button" className="btn primary big" onClick={finishReading}>
            {t('reading.finish')}
          </button>
        </div>
      </section>
    );
  }

  const question = text.questions[questionIndex];
  return (
    <section className="screen">
      {header}
      <h2>{t('reading.questionsTitle')}</h2>
      <QuestionCard key={`${text.id}-${question.id}`} question={question} onDone={onQuestionDone} />
    </section>
  );
}
