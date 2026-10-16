import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlacementTexts } from '../content/loader';
import { comprehensionRatio, effectiveWpm, initialTargetWpm, wordsPerMinute, type PlacementResult } from '../core/reading';
import { Stopwatch } from '../core/stopwatch';
import { db } from '../db/db';
import { useProfile } from '../db/useProfile';
import { getLanguagePack } from '../lang';
import { useApp } from '../store/app';
import { QuestionCard } from '../ui/QuestionCard';
import { ReadingBody } from '../ui/ReadingBody';

type Phase = 'intro' | 'ready' | 'reading' | 'questions';

interface TextResult extends PlacementResult {
  textId: string;
  wordCount: number;
  activeMs: number;
}

export function PlacementScreen() {
  const { t } = useTranslation();
  const { profileId, go, finishPlacement } = useApp();
  const profile = useProfile(profileId);
  const texts = useMemo(() => (profile ? getPlacementTexts(profile.lang, profile.ageGroup) : []), [profile]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const correctCount = useRef(0);
  const activeMs = useRef(0);
  const results = useRef<TextResult[]>([]);
  const stopwatch = useRef(new Stopwatch());

  if (!profile) return null;

  if (texts.length === 0) {
    return (
      <section className="screen">
        <div className="card">
          <p>{t('placement.noTexts')}</p>
          <button type="button" className="btn primary" onClick={() => go('profiles')}>
            {t('placement.next')}
          </button>
        </div>
      </section>
    );
  }

  const text = texts[index];

  const startReading = () => {
    stopwatch.current.reset();
    stopwatch.current.start();
    setPhase('reading');
  };

  const finishReading = () => {
    stopwatch.current.pause();
    activeMs.current = stopwatch.current.elapsedMs;
    correctCount.current = 0;
    setQuestionIndex(0);
    setPhase('questions');
    window.scrollTo(0, 0);
  };

  const onGlossaryToggle = (open: boolean) => (open ? stopwatch.current.pause() : stopwatch.current.start());

  const completePlacement = async (all: TextResult[]) => {
    const now = Date.now();
    await db.sessions.bulkAdd(
      all.map((r) => ({
        profileId: profile.id,
        lang: profile.lang,
        textId: r.textId,
        mode: 'placement' as const,
        wordCount: r.wordCount,
        activeMs: Math.round(r.activeMs),
        wpm: r.wpm,
        comprehension: r.comprehension,
        effectiveWpm: effectiveWpm(r.wpm, r.comprehension),
        createdAt: now,
      })),
    );
    const norm = getLanguagePack(profile.lang).wpmNorms[profile.ageGroup];
    const targetWpm = initialTargetWpm(all, norm);
    await db.profiles.update(profile.id, { targetWpm });

    const avgWpm = Math.round(all.reduce((s, r) => s + r.wpm, 0) / all.length);
    const avgComp = all.reduce((s, r) => s + r.comprehension, 0) / all.length;
    finishPlacement({ wpm: avgWpm, comprehension: avgComp, effectiveWpm: effectiveWpm(avgWpm, avgComp), targetWpm });
  };

  const onQuestionDone = (correct: boolean) => {
    if (correct) correctCount.current++;
    if (questionIndex + 1 < text.questions.length) {
      setQuestionIndex(questionIndex + 1);
      return;
    }
    results.current = [
      ...results.current,
      {
        textId: text.id,
        wordCount: text.wordCount,
        activeMs: activeMs.current,
        wpm: wordsPerMinute(text.wordCount, activeMs.current),
        comprehension: comprehensionRatio(correctCount.current, text.questions.length),
      },
    ];
    if (index + 1 < texts.length) {
      setIndex(index + 1);
      setPhase('ready');
    } else {
      void completePlacement(results.current);
    }
  };

  const progress = <p className="badge">{t('placement.progress', { current: index + 1, total: texts.length })}</p>;

  if (phase === 'intro') {
    return (
      <section className="screen">
        <div className="card">
          <h2>{t('placement.introTitle')}</h2>
          <p className="speech">🦜 {t('placement.intro', { count: texts.length })}</p>
          <p className="hint">{t('placement.glossaryHint')}</p>
          <button type="button" className="btn primary" onClick={() => setPhase('ready')}>
            {t('placement.next')}
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'ready') {
    return (
      <section className="screen">
        <div className="card">
          {progress}
          <h2>{text.title}</h2>
          <p className="byline">{text.author}</p>
          <button type="button" className="btn primary big" onClick={startReading}>
            {t('placement.start')}
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'reading') {
    return (
      <section className="screen reading">
        <div className="card">
          {progress}
          <h2>{text.title}</h2>
          <p className="byline">
            {text.author}
            {text.simplified && <> · {t('placement.simplified')}</>}
          </p>
          <ReadingBody text={text} onGlossaryToggle={onGlossaryToggle} />
          <button type="button" className="btn primary big" onClick={finishReading}>
            {t('placement.finish')}
          </button>
        </div>
      </section>
    );
  }

  const question = text.questions[questionIndex];
  return (
    <section className="screen">
      {progress}
      <h2>{t('placement.questionsTitle')}</h2>
      <QuestionCard key={`${text.id}-${question.id}`} question={question} onDone={onQuestionDone} />
    </section>
  );
}
