import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLevelTexts } from '../content/loader';
import { useProfile } from '../db/useProfile';
import { useSessions } from '../db/sessions';
import { useApp } from '../store/app';
import { MODE_ICON } from '../ui/modes';
import { IslandArt } from '../ui/GameArt';

export function TextSelectScreen() {
  const { t } = useTranslation();
  const { profileId, mode, go, startPlay } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  const groups = useMemo(() => (profile ? getLevelTexts(profile.lang, profile.ageGroup) : []), [profile]);
  const [level, setLevel] = useState(1);

  const bestScore = useMemo(() => {
    const best = new Map<string, number>();
    for (const s of sessions ?? []) {
      if (s.mode !== mode) continue;
      best.set(s.textId, Math.max(best.get(s.textId) ?? 0, s.score ?? 0));
    }
    return best;
  }, [sessions, mode]);

  if (!profile) return null;

  return (
    <section className="screen library-screen">
      <div className="card library-layout">
        <header className="library-intro">
          <IslandArt kind={mode} />
          <h2>
          {MODE_ICON[mode]} {t(`modes.${mode}.title`)}
          </h2>
          <p className="speech">{t(`modes.${mode}.intro`)}</p>
        </header>
        <div className="library-content">
        {groups.length === 0 && <p>{t('textSelect.empty')}</p>}
        <div className="level-tabs" role="tablist" aria-label={t('textSelect.levels')}>
          {groups.map((group) => (
            <button key={group.level} type="button" role="tab" id={`level-tab-${group.level}`} aria-selected={level === group.level} aria-controls="level-texts" tabIndex={level === group.level ? 0 : -1} className={`btn ${level === group.level ? 'selected' : ''}`} onClick={() => setLevel(group.level)} onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const index = groups.findIndex((item) => item.level === group.level);
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + groups.length) % groups.length;
              setLevel(groups[next].level);
              document.getElementById(`level-tab-${groups[next].level}`)?.focus();
            }}>
              {t('textSelect.level', { level: group.level })}
            </button>
          ))}
        </div>
        {groups.filter((group) => group.level === level).map(({ texts }) => (
          <div key={level} role="tabpanel" id="level-texts" aria-labelledby={`level-tab-${level}`}>
            <ul className="text-list">
              {texts.map((text) => {
                const best = bestScore.get(text.id);
                return (
                  <li key={text.id}>
                    <button type="button" className="btn text-pick" onClick={() => startPlay(text.id)}>
                      <span className="text-title">{best !== undefined ? '⭐' : '📜'} {text.title}</span>
                      <small>
                        {text.author} · {t('textSelect.words', { count: text.wordCount })}
                        {best !== undefined && <> · {t('textSelect.best', { score: best })}</>}
                      </small>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        </div>
        <div className="row library-actions">
          <button type="button" className="btn ghost" onClick={() => go('home')}>
            {t('textSelect.back')}
          </button>
        </div>
      </div>
    </section>
  );
}
