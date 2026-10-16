import { useTranslation } from 'react-i18next';
import { getTextById } from '../content/loader';
import { comprehensionRatio, effectiveWpm, wordsPerMinute } from '../core/reading';
import { scoreSession, streakDays } from '../core/scoring';
import { db } from '../db/db';
import { getSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { useApp } from '../store/app';
import { ReadingRun, type RunResult } from '../ui/ReadingRun';

export function ExploreScreen() {
  const { t } = useTranslation();
  const { profileId, textId, finishExplore } = useApp();
  const profile = useProfile(profileId);
  const text = textId ? getTextById(textId) : undefined;
  if (!profile || !text) return null;

  const onComplete = async ({ activeMs, correct, total }: RunResult) => {
    const now = Date.now();
    const wpm = wordsPerMinute(text.wordCount, activeMs);
    const comprehension = comprehensionRatio(correct, total);
    const eff = effectiveWpm(wpm, comprehension);

    const previous = await getSessions(profile.id, profile.lang);
    const sameText = previous.filter((s) => s.textId === text.id && s.mode !== 'placement');
    const previousBest = sameText.length > 0 ? Math.max(...sameText.map((s) => s.effectiveWpm)) : null;
    const streak = streakDays([...previous.map((s) => s.createdAt), now], now);
    const score = scoreSession({ mode: 'explore', wpm, comprehension, effectiveWpm: eff, targetWpm: profile.targetWpm, streakDays: streak });

    await db.sessions.add({
      profileId: profile.id,
      lang: profile.lang,
      textId: text.id,
      mode: 'explore',
      wordCount: text.wordCount,
      activeMs: Math.round(activeMs),
      wpm,
      comprehension,
      effectiveWpm: eff,
      score: score.total,
      createdAt: now,
    });

    finishExplore({
      textId: text.id,
      title: text.title,
      wpm,
      comprehension,
      effectiveWpm: eff,
      targetWpm: profile.targetWpm,
      previousBest,
      streakDays: streak,
      score,
    });
  };

  return (
    <ReadingRun
      key={text.id}
      text={text}
      header={<p className="badge">🏝️ {t('explore.title')}</p>}
      onComplete={(r) => void onComplete(r)}
    />
  );
}
