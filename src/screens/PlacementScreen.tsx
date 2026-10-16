import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlacementTexts } from '../content/loader';
import { comprehensionRatio, effectiveWpm, initialTargetWpm, wordsPerMinute, type PlacementResult } from '../core/reading';
import { db } from '../db/db';
import { useProfile } from '../db/useProfile';
import { getLanguagePack } from '../lang';
import { useApp } from '../store/app';
import { ReadingRun, type RunResult } from '../ui/ReadingRun';

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
  const [started, setStarted] = useState(false);
  const results = useRef<TextResult[]>([]);

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
        score: 0,
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

  const onComplete = ({ activeMs, correct, total }: RunResult) => {
    results.current = [
      ...results.current,
      {
        textId: text.id,
        wordCount: text.wordCount,
        activeMs,
        wpm: wordsPerMinute(text.wordCount, activeMs),
        comprehension: comprehensionRatio(correct, total),
      },
    ];
    if (index + 1 < texts.length) setIndex(index + 1);
    else void completePlacement(results.current);
  };

  if (!started) {
    return (
      <section className="screen">
        <div className="card">
          <h2>{t('placement.introTitle')}</h2>
          <p className="speech">🦜 {t('placement.intro', { count: texts.length })}</p>
          <button type="button" className="btn primary" onClick={() => setStarted(true)}>
            {t('placement.next')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <ReadingRun
      key={text.id}
      text={text}
      header={<p className="badge">{t('placement.progress', { current: index + 1, total: texts.length })}</p>}
      onComplete={onComplete}
    />
  );
}
