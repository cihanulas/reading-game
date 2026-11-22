import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CheckQuestion, LessonScene } from '../../ogretmen/src/types';
import { BoardView } from './BoardView';
import { Parrot } from './Parrot';
import { speak } from './speak';

/** Doğru cevabın yazısı ekranda kalsın; çocuk okuyup bitirebilsin. */
export function answerHoldMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(12000, 6000 + words * 300);
}

export function LessonPlayer({
  title,
  lang,
  scenes,
  images,
  recap,
  glossary,
  onExit,
}: {
  title: string;
  lang: string;
  scenes: LessonScene[];
  images: string[];
  recap?: { points: string[]; say: string };
  glossary?: { term: string; meaning: string }[];
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [talking, setTalking] = useState(false);
  const [rate, setRate] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [finished, setFinished] = useState(false);
  const [checkNote, setCheckNote] = useState<string | null>(null);
  const [lockedChoice, setLockedChoice] = useState<number | null>(null);
  const advance = useRef<() => void>(() => {});
  const generation = useRef(0);
  const holdTimer = useRef<number | null>(null);

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const scene = scenes[sceneIndex];
  const step = scene?.steps[stepIndex];

  advance.current = () => {
    clearHold();
    if (!scene) return;
    if (stepIndex + 1 < scene.steps.length) {
      setStepIndex(stepIndex + 1);
      setCheckNote(null);
      setLockedChoice(null);
      return;
    }
    if (sceneIndex + 1 < scenes.length) {
      setSceneIndex(sceneIndex + 1);
      setStepIndex(0);
      setCheckNote(null);
      setLockedChoice(null);
      return;
    }
    setFinished(true);
    setTalking(false);
  };

  useEffect(() => clearHold, []);

  useEffect(() => {
    if (paused || finished || !step) return;
    const current = ++generation.current;
    setTalking(true);
    const stop = speak(step.say, lang, rate, () => {
      if (generation.current !== current) return;
      setTalking(false);
      if (!step.check) advance.current();
    });
    return () => {
      generation.current += 1;
      setTalking(false);
      stop();
    };
  }, [sceneIndex, stepIndex, paused, nonce, rate, finished, step, lang]);

  const go = (nextScene: number, nextStep: number) => {
    clearHold();
    setFinished(false);
    setCheckNote(null);
    setLockedChoice(null);
    setSceneIndex(nextScene);
    setStepIndex(nextStep);
  };

  const answerCheck = (check: CheckQuestion, index: number) => {
    if (lockedChoice !== null) return;
    if (index === check.answerIndex) {
      setLockedChoice(index);
      setCheckNote(check.onCorrect);
      clearHold();
      holdTimer.current = window.setTimeout(() => advance.current(), answerHoldMs(check.onCorrect));
    } else {
      setCheckNote(check.onWrong);
    }
  };

  if (finished) {
    return (
      <section className="card teacher-done">
        <h2>{t('teacher.done')}</h2>
        {recap && (
          <>
            <p>{recap.say}</p>
            <ul>{recap.points.map((point) => <li key={point}>{point}</li>)}</ul>
          </>
        )}
        <div className="row">
          <button type="button" className="btn primary" onClick={() => go(0, 0)}>{t('teacher.replay')}</button>
          <button type="button" className="btn ghost" onClick={onExit}>{t('teacher.back')}</button>
        </div>
      </section>
    );
  }

  if (!scene || !step) return null;

  return (
    <div className="teacher-stage">
      <div>
        <p className="eyebrow">{t('teacher.scene')} {sceneIndex + 1}/{scenes.length} · {scene.title}</p>
        <h2>{title}</h2>
        <BoardView steps={scene.steps} upTo={stepIndex} images={images} />
      </div>
      <aside className="teacher-side">
        <Parrot mood={step.avatar?.mood} gesture={step.avatar?.gesture} talking={talking} />
        {captions && <p className="teacher-caption">{step.caption || step.say}</p>}
        {step.check && (
          <div className="teacher-check">
            <p>{step.check.question}</p>
            <div className="row wrap">
              {step.check.choices.map((choice, index) => (
                <button
                  key={choice}
                  type="button"
                  className={`btn${lockedChoice === index ? ' is-right' : ''}`}
                  disabled={lockedChoice !== null}
                  onClick={() => answerCheck(step.check!, index)}
                >{choice}</button>
              ))}
            </div>
            {checkNote && <p className="teacher-note">{checkNote}</p>}
          </div>
        )}
        <div className="row wrap teacher-controls">
          <button type="button" className="btn" onClick={() => setPaused((value) => !value)}>{paused ? t('teacher.resume') : t('teacher.pause')}</button>
          <button type="button" className="btn" onClick={() => setNonce((value) => value + 1)}>{t('teacher.again')}</button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (stepIndex > 0) go(sceneIndex, stepIndex - 1);
              else if (sceneIndex > 0) go(sceneIndex - 1, scenes[sceneIndex - 1].steps.length - 1);
            }}
          >{t('teacher.prev')}</button>
          <button type="button" className="btn primary" onClick={() => advance.current()}>{t('teacher.next')}</button>
        </div>
        <label className="teacher-speed">{t('teacher.speed')}
          <input type="range" min="0.8" max="1.2" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        </label>
        <label className="teacher-captions"><input type="checkbox" checked={captions} onChange={(event) => setCaptions(event.target.checked)} /> {t('teacher.captions')}</label>
        {glossary && glossary.length > 0 && (
          <details>
            <summary>{t('teacher.words')}</summary>
            <dl>{glossary.map((entry) => <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.meaning}</dd></div>)}</dl>
          </details>
        )}
        <button type="button" className="btn ghost" onClick={onExit}>{t('teacher.back')}</button>
      </aside>
    </div>
  );
}
