import { useTranslation } from 'react-i18next';
import { streakDays } from '../core/scoring';
import { useSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { GAME_MODES, useApp } from '../store/app';
import { MODE_ICON } from '../ui/modes';

export function HomeScreen() {
  const { t } = useTranslation();
  const { profileId, go, chooseMode } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  if (!profile) return null;

  const totalScore = (sessions ?? []).reduce((sum, s) => sum + (s.score ?? 0), 0);
  const streak = streakDays((sessions ?? []).map((s) => s.createdAt), Date.now());

  return (
    <section className="screen">
      <div className="card center">
        <div className="avatar big">{profile.avatar}</div>
        <h2>{t('home.welcome', { name: profile.name })}</h2>
        {profile.targetWpm !== null && <p>{t('home.target', { wpm: profile.targetWpm })}</p>}
        <dl className="stats">
          <div>
            <dt>{t('home.totalScore')}</dt>
            <dd>🪙 {totalScore}</dd>
          </div>
          <div>
            <dt>{t('home.streak')}</dt>
            <dd>🔥 {t('home.streakDays', { count: streak })}</dd>
          </div>
        </dl>
        <div className="islands">
          {GAME_MODES.map((mode) => (
            <button key={mode} type="button" className="btn primary big island" onClick={() => chooseMode(mode)}>
              <span aria-hidden>{MODE_ICON[mode]}</span> {t(`modes.${mode}.title`)}
            </button>
          ))}
        </div>
        <p className="speech">🦜 {t('home.comingSoon')}</p>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => go('placement')}>
            {t('home.retakePlacement')}
          </button>
          <button type="button" className="btn primary" onClick={() => go('profiles')}>
            {t('home.switchProfile')}
          </button>
        </div>
      </div>
    </section>
  );
}
