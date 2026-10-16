import { useTranslation } from 'react-i18next';
import { getTextById } from '../content/loader';
import { chestsEarned, earnedBadges, mapPieces, PIECES_PER_CHEST, unlockedIslands } from '../core/progress';
import { adaptTarget, comprehensionRatio, effectiveWpm, wordsPerMinute } from '../core/reading';
import { scoreSession, streakDays } from '../core/scoring';
import { db, type ReadingSession } from '../db/db';
import { getSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { getLanguagePack } from '../lang';
import { useApp } from '../store/app';
import { MODE_ICON, MODE_PRESENTATION } from '../ui/modes';
import { ReadingRun, type RunResult } from '../ui/ReadingRun';

export function PlayScreen() {
  const { t } = useTranslation();
  const { profileId, mode, textId, finishPlay } = useApp();
  const profile = useProfile(profileId);
  const text = textId ? getTextById(textId) : undefined;
  if (!profile || !text) return null;

  const onComplete = async ({ activeMs, correct, total }: RunResult) => {
    const now = Date.now();
    const wpm = wordsPerMinute(text.wordCount, activeMs);
    const comprehension = comprehensionRatio(correct, total);
    const eff = effectiveWpm(wpm, comprehension);

    const previous = await getSessions(profile.id, profile.lang);
    const sameText = previous.filter((s) => s.textId === text.id && s.mode === mode);
    const previousBest = sameText.length > 0 ? Math.max(...sameText.map((s) => s.effectiveWpm)) : null;
    const streak = streakDays([...previous.map((s) => s.createdAt), now], now);
    const score = scoreSession({ mode, wpm, comprehension, effectiveWpm: eff, targetWpm: profile.targetWpm, streakDays: streak });

    const norm = getLanguagePack(profile.lang).wpmNorms[profile.ageGroup];
    const newTarget = profile.targetWpm === null ? null : adaptTarget(profile.targetWpm, wpm, comprehension, norm);

    const session: Omit<ReadingSession, 'id'> = {
      profileId: profile.id,
      lang: profile.lang,
      textId: text.id,
      mode,
      wordCount: text.wordCount,
      activeMs: Math.round(activeMs),
      wpm,
      comprehension,
      effectiveWpm: eff,
      score: score.total,
      targetWpm: profile.targetWpm,
      createdAt: now,
    };
    const after = [...previous, session];
    const badgesBefore = earnedBadges(previous);
    const islandsBefore = unlockedIslands(previous);

    await db.transaction('rw', db.sessions, db.profiles, async () => {
      await db.sessions.add(session);
      if (newTarget !== profile.targetWpm) await db.profiles.update(profile.id, { targetWpm: newTarget });
    });

    finishPlay({
      mode,
      textId: text.id,
      title: text.title,
      wpm,
      comprehension,
      effectiveWpm: eff,
      previousTarget: profile.targetWpm,
      newTarget,
      previousBest,
      streakDays: streak,
      score,
      newBadges: earnedBadges(after).filter((b) => !badgesBefore.includes(b)),
      newIslands: unlockedIslands(after).filter((i) => !islandsBefore.includes(i)),
      chestEarned: chestsEarned(after) > chestsEarned(previous),
      pieces: mapPieces(after) % PIECES_PER_CHEST,
    });
  };

  return (
    <ReadingRun
      key={text.id}
      text={text}
      presentation={MODE_PRESENTATION[mode]}
      wpm={profile.targetWpm ?? undefined}
      header={
        <p className="badge">
          {MODE_ICON[mode]} {t(`modes.${mode}.title`)}
        </p>
      }
      onComplete={(r) => void onComplete(r)}
    />
  );
}
