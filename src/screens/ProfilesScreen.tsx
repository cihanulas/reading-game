import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, type Profile } from '../db/db';
import { useApp } from '../store/app';
import { CharacterArt, IslandArt, OceanDecor } from '../ui/GameArt';
import { ArrowRight, Plus } from 'lucide-react';

export function ProfilesScreen() {
  const { t } = useTranslation();
  const { go, selectProfile } = useApp();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    db.profiles.orderBy('createdAt').toArray().then(setProfiles);
  }, []);

  if (profiles === null) return null;

  return (
    <section className="screen profiles-screen">
      <header className="profile-world">
        <OceanDecor />
        <h1>{t('app.title')}</h1>
        <div className="profile-islands" aria-hidden="true"><IslandArt kind="explore" /><IslandArt kind="pacer" /></div>
      </header>
      <div className="profile-panel">
        <h2>{t('profiles.title')}</h2>
        {profiles.length === 0 && <p>{t('profiles.empty')}</p>}
        <ul className="profile-list">
          {profiles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="btn profile"
                onClick={() => selectProfile(p.id, p.targetWpm === null ? 'placement' : 'home')}
              >
                <CharacterArt value={p.avatar} />
                <span className="profile-info">
                  <strong>{p.name}</strong>
                  <small>
                    {t(`ageGroup.${p.ageGroup}`)} · {t(`language.${p.lang}`)}
                    {p.targetWpm !== null && <> · {t('profiles.target', { wpm: p.targetWpm })}</>}
                  </small>
                </span>
                <ArrowRight className="profile-arrow" size={21} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn primary" onClick={() => go('createProfile')}>
          <Plus size={19} aria-hidden="true" /> {t('profiles.new')}
        </button>
      </div>
      <a className="credits-link" href="/CREDITS.txt" target="_blank" rel="noreferrer">
        {t('about.credits')}
      </a>
    </section>
  );
}
