import { motion } from 'motion/react';
import { Gift, Flag, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BADGE_ICON, PIECES_PER_CHEST } from '../core/progress';
import { MIN_COMPREHENSION_FOR_TARGET } from '../core/scoring';
import { useApp } from '../store/app';
import { MODE_ICON } from '../ui/modes';
import { playSound } from '../ui/sound';
import { PageNavigation } from '../ui/PageNavigation';
import { Celebration } from '../ui/Celebration';
import { getTextById } from '../content/loader';

const pop = (i: number) => ({
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { delay: 0.3 + i * 0.25, type: 'spring' as const, stiffness: 260, damping: 14 },
});

export function PlayResultScreen() {
  const { t } = useTranslation();
  const { playSummary: s, go } = useApp();
  const [rewardPage, setRewardPage] = useState(0);

  useEffect(() => {
    if (!s) return;
    const fx = s.milestones.journey || s.milestones.island || s.newIslands.length > 0 ? 'unlock' : s.chestEarned ? 'chest' : s.newBadges.length > 0 || s.milestones.levels.length > 0 ? 'badge' : null;
    if (s.score.targetBonus > 0 || s.comprehension >= MIN_COMPREHENSION_FOR_TARGET) playSound('success');
    const timer = fx ? setTimeout(() => playSound(fx), 600) : undefined;
    return () => clearTimeout(timer);
  }, [s]);

  if (!s) return null;
  const activity = getTextById(s.textId)?.activity;
  const milestoneTitle = s.milestones.journey ? t('journey.completed') : s.milestones.island ? t('journey.islandComplete') : s.milestones.levels.length ? t('journey.levelComplete', { level: s.milestones.levels[0] }) : t('playResult.title');
  const encouragement = s.milestones.journey ? t('journey.finalMessage') : s.milestones.island ? t('journey.islandMessage') : s.milestones.levels.length ? t('journey.levelMessage') : null;

  const wpm = (value: number) => t('placementResult.unitWpm', { value });
  const stats = [
    { label: s.voice ? t('voice.wcpm') : t('placementResult.speed'), value: wpm(s.wpm) },
    { label: t('placementResult.comprehension'), value: t('placementResult.percent', { value: Math.round(s.comprehension * 100) }) },
    { label: t('placementResult.effective'), value: wpm(s.effectiveWpm) },
  ];
  if (s.voice) {
    stats.push(
      { label: t('voice.accuracy'), value: t('voice.accuracyValue', { matched: s.voice.matched, total: s.voice.total }) },
      { label: t('voice.stumbles'), value: String(s.voice.stumbles) },
    );
  }

  const message =
    s.comprehension < MIN_COMPREHENSION_FOR_TARGET
      ? t('playResult.lowComprehension')
      : s.voice
        ? t('voice.resultGood')
        : s.score.targetBonus > 0
          ? t('playResult.targetReached')
          : t('playResult.targetMissed');

  const lines = [
    { label: t('playResult.base', { multiplier: s.score.multiplier }), value: s.score.base },
    { label: t('playResult.targetBonus'), value: s.score.targetBonus },
    { label: t('playResult.perfectBonus'), value: s.score.perfectBonus },
    { label: t('playResult.streakBonus', { days: s.streakDays }), value: s.score.streakBonus },
  ].filter((l) => l.value > 0);

  const targetChange =
    s.previousTarget === null || s.newTarget === null
      ? null
      : s.newTarget > s.previousTarget
        ? t('playResult.targetUp', { from: s.previousTarget, to: s.newTarget })
        : s.newTarget < s.previousTarget
          ? t('playResult.targetDown', { from: s.previousTarget, to: s.newTarget })
          : t('playResult.targetSame', { value: s.newTarget });

  const rewards = [
    ...s.milestones.levels.map((level) => ({ id: `level-${level}`, icon: <Flag size={22} />, label: t('journey.levelComplete', { level }), kind: 'milestone-reward' })),
    ...(s.milestones.island ? [{ id: 'island-complete', icon: <Trophy size={22} />, label: t('journey.islandComplete'), kind: 'milestone-reward' }] : []),
    ...s.newIslands.map((id) => ({ id: `island-${id}`, icon: MODE_ICON[id], label: t('rewards.islandUnlocked', { island: t(`modes.${id}.title`) }), kind: 'island-unlock' })),
    ...s.newBadges.map((id) => ({ id: `badge-${id}`, icon: BADGE_ICON[id], label: t('rewards.newBadge', { badge: t(`badges.${id}.title`) }), kind: '' })),
    s.chestEarned
      ? { id: 'chest', icon: '🧰', label: t('rewards.chestEarned'), kind: 'chest' }
      : { id: 'pieces', icon: '🧩', label: t('rewards.pieces', { count: s.pieces, total: PIECES_PER_CHEST }), kind: 'muted' },
  ];

  return (
    <section className="screen result-screen">
      <div className="card center result-layout">
        <div className="result-summary">
        <Celebration grand={s.milestones.journey || s.milestones.island} />
        <h2>{milestoneTitle}</h2>
        <p className="byline">{s.title}</p>
        <p className="speech">{encouragement ?? message}</p>
        <dl className="stats">
          {stats.map((st) => (
            <div key={st.label}>
              <dt>{st.label}</dt>
              <dd>{st.value}</dd>
            </div>
          ))}
        </dl>
        {targetChange && <p className="target">{targetChange}</p>}
        {s.previousBest !== null && (
          <p>
            {s.effectiveWpm > s.previousBest
              ? `🏆 ${t('playResult.newRecord', { value: s.previousBest })}`
              : t('playResult.previousBest', { value: s.previousBest })}
          </p>
        )}
        </div>
        <div className="result-details">
        <table className="score-table">
          <caption>{t('playResult.score')}</caption>
          <tbody>
            {lines.map((l) => (
              <tr key={l.label}>
                <th scope="row">{l.label}</th>
                <td>+{l.value}</td>
              </tr>
            ))}
            <tr className="total">
              <th scope="row">{t('playResult.total')}</th>
              <td>{s.score.total}</td>
            </tr>
          </tbody>
        </table>
        <ul className="rewards">
          {rewards.slice(rewardPage * 4, (rewardPage + 1) * 4).map((reward, index) => (
            <motion.li key={reward.id} className={`reward ${reward.kind}`} {...pop(index + 1)}>
              <span className="reward-icon">{reward.icon}</span>
              {reward.label}
            </motion.li>
          ))}
        </ul>
        <PageNavigation page={rewardPage} total={Math.ceil(rewards.length / 4)} onChange={setRewardPage} />
        </div>
        <div className="row result-actions">
          {s.milestones.journey && (
            <button type="button" className="btn primary" onClick={() => go('journey')}>
              <Gift size={20} aria-hidden="true" /> {t('journey.openGift')}
            </button>
          )}
          <button type="button" className="btn ghost" onClick={() => go('home')}>
            {t('playResult.home')}
          </button>
          {s.chestEarned && (
            <button type="button" className="btn primary" onClick={() => go('treasure')}>
              🧰 {t('rewards.openChest')}
            </button>
          )}
          <button type="button" className="btn primary" onClick={() => go(activity ? 'journey' : 'textSelect')}>
            {t(activity ? 'journey.activities' : 'playResult.again')}
          </button>
        </div>
      </div>
    </section>
  );
}
