import { useTranslation } from 'react-i18next';
import { useProfile } from '../db/useProfile';
import { useApp } from '../store/app';

export function HomeScreen() {
  const { t } = useTranslation();
  const { profileId, go } = useApp();
  const profile = useProfile(profileId);
  if (!profile) return null;

  return (
    <section className="screen">
      <div className="card center">
        <div className="avatar big">{profile.avatar}</div>
        <h2>{t('home.welcome', { name: profile.name })}</h2>
        {profile.targetWpm !== null && <p>{t('home.target', { wpm: profile.targetWpm })}</p>}
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
