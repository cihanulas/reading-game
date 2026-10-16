import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getLevelTexts } from '../content/loader';
import { useProfile } from '../db/useProfile';
import { useSessions } from '../db/sessions';
import { useApp } from '../store/app';

export function ExploreSelectScreen() {
  const { t } = useTranslation();
  const { profileId, go, startExplore } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  const groups = useMemo(() => (profile ? getLevelTexts(profile.lang, profile.ageGroup) : []), [profile]);

  const bestScore = useMemo(() => {
    const best = new Map<string, number>();
    for (const s of sessions ?? []) {
      if (s.mode === 'placement') continue;
      best.set(s.textId, Math.max(best.get(s.textId) ?? 0, s.score ?? 0));
    }
    return best;
  }, [sessions]);

  if (!profile) return null;

  return (
    <section className="screen">
      <div className="card">
        <h2>🏝️ {t('explore.title')}</h2>
        <p className="speech">🦜 {t('explore.intro')}</p>
        {groups.length === 0 && <p>{t('explore.empty')}</p>}
        {groups.map(({ level, texts }) => (
          <div key={level}>
            <h3>{t('explore.level', { level })}</h3>
            <ul className="text-list">
              {texts.map((text) => {
                const best = bestScore.get(text.id);
                return (
                  <li key={text.id}>
                    <button type="button" className="btn text-pick" onClick={() => startExplore(text.id)}>
                      <span className="text-title">{best !== undefined ? '⭐' : '📜'} {text.title}</span>
                      <small>
                        {text.author} · {t('explore.words', { count: text.wordCount })}
                        {best !== undefined && <> · {t('explore.best', { score: best })}</>}
                      </small>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => go('home')}>
            {t('explore.back')}
          </button>
        </div>
      </div>
    </section>
  );
}
