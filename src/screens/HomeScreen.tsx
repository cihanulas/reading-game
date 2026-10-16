import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { chestsEarned, islandStates, type IslandState } from '../core/progress';
import { streakDays } from '../core/scoring';
import { useRewards } from '../db/rewards';
import { useSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { GAME_MODES, useApp, type GameMode } from '../store/app';
import { MODE_ICON } from '../ui/modes';
import { playSound } from '../ui/sound';
import { SoundToggle } from '../ui/SoundToggle';
import { isVoiceSupported } from '../ui/speechRecognition';

/** Island positions on the map, in percent of the map box. */
const POSITION: Record<IslandState['id'], { left: number; top: number }> = {
  explore: { left: 18, top: 72 },
  pacer: { left: 48, top: 42 },
  rsvp: { left: 80, top: 66 },
  voice: { left: 76, top: 16 },
};

const isGameMode = (id: string): id is GameMode => (GAME_MODES as string[]).includes(id);
/** Islands this browser cannot run (read-aloud needs speech recognition). */
const unsupported = (id: IslandState['id']) => id === 'voice' && !isVoiceSupported();

export function HomeScreen() {
  const { t } = useTranslation();
  const { profileId, go, chooseMode } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  const { rewards } = useRewards(profile?.id, profile?.lang);
  if (!profile || !sessions || !rewards) return null;

  const coins = sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) + rewards.reduce((sum, r) => sum + r.coins, 0);
  const streak = streakDays(sessions.map((s) => s.createdAt), Date.now());
  const unopened = chestsEarned(sessions) - rewards.length;
  const islands = islandStates(sessions);
  const route = islands.map(({ id }) => `${POSITION[id].left},${POSITION[id].top}`).join(' ');

  const enter = (island: IslandState) => {
    if (!island.unlocked || !isGameMode(island.id) || unsupported(island.id)) {
      playSound('wrong');
      return;
    }
    playSound('tap');
    chooseMode(island.id);
  };

  return (
    <section className="screen">
      <div className="card">
        <header className="home-head">
          <div className="avatar big">{profile.avatar}</div>
          <div>
            <h2>{t('home.welcome', { name: profile.name })}</h2>
            {profile.targetWpm !== null && <p>{t('home.target', { wpm: profile.targetWpm })}</p>}
          </div>
          <SoundToggle />
        </header>
        <dl className="stats">
          <div>
            <dt>{t('home.totalScore')}</dt>
            <dd>🪙 {coins}</dd>
          </div>
          <div>
            <dt>{t('home.streak')}</dt>
            <dd>🔥 {t('home.streakDays', { count: streak })}</dd>
          </div>
        </dl>

        <div className="sea-map" role="group" aria-label={t('home.map')}>
          <svg className="route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polyline points={route} />
          </svg>
          {islands.map((island, i) => {
            const blocked = unsupported(island.id);
            const locked = !island.unlocked || blocked;
            const hint = blocked
              ? t('voice.unsupported')
              : !island.unlocked && island.requires
                ? t('home.locked', { count: island.remaining, island: t(`modes.${island.requires}.title`) })
                : null;
            return (
              <div key={island.id} className="island-spot" style={{ left: `${POSITION[island.id].left}%`, top: `${POSITION[island.id].top}%` }}>
                <motion.button
                  type="button"
                  className={`island ${locked ? 'locked' : ''}`}
                  onClick={() => enter(island)}
                  aria-disabled={locked}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.12, type: 'spring', stiffness: 220, damping: 15 }}
                  whileHover={locked ? undefined : { scale: 1.08 }}
                  whileTap={locked ? { x: [0, -6, 6, -4, 4, 0] } : { scale: 0.92 }}
                >
                  <span className="island-icon" aria-hidden>
                    {locked ? '🔒' : MODE_ICON[island.id]}
                  </span>
                  <span className="island-name">{t(`modes.${island.id}.title`)}</span>
                  {hint && <small>{hint}</small>}
                </motion.button>
              </div>
            );
          })}
        </div>

        <div className="row">
          <button type="button" className="btn primary" onClick={() => go('treasure')}>
            🧰 {t('home.treasure')}
            {unopened > 0 && <span className="pill">{unopened}</span>}
          </button>
          <button type="button" className="btn primary" onClick={() => go('progress')}>
            📈 {t('home.progress')}
          </button>
          <button type="button" className="btn ghost" onClick={() => go('placement')}>
            {t('home.retakePlacement')}
          </button>
          <button type="button" className="btn ghost" onClick={() => go('profiles')}>
            {t('home.switchProfile')}
          </button>
        </div>
      </div>
    </section>
  );
}
