import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, type Profile } from '../db/db';
import { useApp } from '../store/app';

export function ProfilesScreen() {
  const { t } = useTranslation();
  const { go, selectProfile } = useApp();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    db.profiles.orderBy('createdAt').toArray().then(setProfiles);
  }, []);

  if (profiles === null) return null;

  return (
    <section className="screen">
      <h1>{t('app.title')}</h1>
      <div className="card">
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
                <span className="avatar">{p.avatar}</span>
                <span className="profile-info">
                  <strong>{p.name}</strong>
                  <small>
                    {t(`ageGroup.${p.ageGroup}`)} · {t(`language.${p.lang}`)}
                    {p.targetWpm !== null && <> · {t('profiles.target', { wpm: p.targetWpm })}</>}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn primary" onClick={() => go('createProfile')}>
          {t('profiles.new')}
        </button>
      </div>
      <a className="credits-link" href="/CREDITS.txt" target="_blank" rel="noreferrer">
        {t('about.credits')}
      </a>
    </section>
  );
}
