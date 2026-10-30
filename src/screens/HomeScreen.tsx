import { motion } from 'motion/react';
import { ChartNoAxesCombined, PackageOpen, Coins, Flame, LockKeyhole, RotateCcw, Users, Gift, Flag, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { chestsEarned, islandStates, journeyProgress, type IslandState } from '../core/progress';
import { getLevelTexts } from '../content/loader';
import { streakDays } from '../core/scoring';
import { useRewards } from '../db/rewards';
import { useSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { GAME_MODES, useApp, type GameMode } from '../store/app';
import { CharacterArt, IslandArt, OceanDecor } from '../ui/GameArt';
import { playSound } from '../ui/sound';
import { SoundToggle } from '../ui/SoundToggle';
import { isVoiceSupported } from '../ui/speechRecognition';

/** Island positions on the map, in percent of the map box. */
const POSITION: Record<IslandState['id'], { left: number; top: number }> = {
  explore: { left: 15, top: 60 },
  pacer: { left: 39, top: 36 },
  rsvp: { left: 63, top: 60 },
  voice: { left: 86, top: 36 },
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
  const groups = getLevelTexts(profile.lang, profile.ageGroup);
  const journey = journeyProgress(sessions, groups);
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
    <section className="screen home-screen">
      <div className="voyage-layout">
        <header className="home-head">
          <CharacterArt value={profile.avatar} className="home-character" />
          <div>
            <span className="eyebrow">{t('app.title')}</span>
            <h2>{t('home.welcome', { name: profile.name })}</h2>
            {profile.targetWpm !== null && <p>{t('home.target', { wpm: profile.targetWpm })}</p>}
          </div>
          <SoundToggle />
        </header>
        <dl className="stats">
          <div>
            <dt>{t('home.totalScore')}</dt>
            <dd><Coins aria-hidden="true" /> {coins}</dd>
          </div>
          <div>
            <dt>{t('home.streak')}</dt>
            <dd><Flame aria-hidden="true" /> {t('home.streakDays', { count: streak })}</dd>
          </div>
          <div className="home-journey">
            <dt>{t('journey.title')}</dt>
            <dd><button type="button" className="journey-link" onClick={() => go('journey')}>
              {journey.complete ? <Gift aria-hidden="true" /> : <Flag aria-hidden="true" />}
              {t(journey.complete ? 'journey.openGift' : 'journey.progress', journey)}
            </button></dd>
            <progress value={journey.done} max={journey.total || 1} aria-label={t('journey.title')} />
          </div>
        </dl>

        <div className="sea-map" role="group" aria-label={t('home.map')}>
          <OceanDecor />
          <svg className="route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polyline points={route} />
          </svg>
          {islands.map((island, i) => {
            const islandProgress = journeyProgress(sessions, groups, island.id);
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
                  className={`island island-${island.id} ${locked ? 'locked' : ''}`}
                  onClick={() => enter(island)}
                  aria-disabled={locked}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.12, type: 'spring', stiffness: 220, damping: 15 }}
                  whileHover={locked ? undefined : { scale: 1.08 }}
                  whileTap={locked ? { x: [0, -6, 6, -4, 4, 0] } : { scale: 0.92 }}
                >
                  <IslandArt kind={island.id} />
                  <span className="island-name">{locked && <LockKeyhole size={13} aria-hidden="true" />}{islandProgress.complete && <CheckCircle2 size={16} aria-hidden="true" />}{t(`modes.${island.id}.title`)}</span>
                  {hint && <small>{hint}</small>}
                  {!hint && <small className="island-completion">{t('journey.progress', islandProgress)}</small>}
                </motion.button>
              </div>
            );
          })}
        </div>

        <div className="row map-actions">
          <button type="button" className="btn primary" onClick={() => go('treasure')}>
            <PackageOpen size={20} aria-hidden="true" /> {t('home.treasure')}
            {unopened > 0 && <span className="pill">{unopened}</span>}
          </button>
          <button type="button" className="btn primary" onClick={() => go('progress')}>
            <ChartNoAxesCombined size={20} aria-hidden="true" /> {t('home.progress')}
          </button>
          <button type="button" className="btn ghost" onClick={() => go('placement')}>
            <RotateCcw size={16} aria-hidden="true" /> {t('home.retakePlacement')}
          </button>
          <button type="button" className="btn ghost" onClick={() => go('profiles')}>
            <Users size={16} aria-hidden="true" /> {t('home.switchProfile')}
          </button>
        </div>
      </div>
    </section>
  );
}
