import { useMemo, useState } from 'react';
import { CheckCircle2, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLevelTexts } from '../content/loader';
import { useProfile } from '../db/useProfile';
import { useSessions } from '../db/sessions';
import { useApp } from '../store/app';
import { MODE_ICON } from '../ui/modes';
import { IslandArt } from '../ui/GameArt';
import { isSuccessful, journeyProgress } from '../core/progress';

export function TextSelectScreen() {
  const { t } = useTranslation();
  const { profileId, mode, go, startPlay } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  const groups = useMemo(() => (profile ? getLevelTexts(profile.lang, profile.ageGroup) : []), [profile]);
  const [chosenLevel, setLevel] = useState<number | null>(null);
  const progress = journeyProgress(sessions ?? [], groups, mode);
  const level = chosenLevel ?? progress.levels.find((group) => group.done < group.total)?.level ?? 1;
  const completed = new Set((sessions ?? []).filter((session) => session.mode === mode && isSuccessful(session)).map((session) => session.textId));

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
          <p className="library-progress">{t('journey.progress', progress)}</p>
          <progress value={progress.done} max={progress.total || 1} aria-label={t(`modes.${mode}.title`)} />
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
              {progress.levels.find((item) => item.level === group.level)?.done === group.texts.length && <CheckCircle2 size={15} aria-label={t('journey.understood')} />}
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
                      <span className="text-title">{completed.has(text.id) && <CheckCircle2 size={18} aria-hidden="true" />} {text.title}</span>
                      <span className={`text-status ${completed.has(text.id) ? 'complete' : ''}`}>{t(completed.has(text.id) ? 'journey.understood' : 'journey.notYet')}</span>
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
          <button type="button" className="btn ghost" onClick={() => go('journey')}><Gift size={18} aria-hidden="true" />{t('journey.title')}</button>
        </div>
      </div>
    </section>
  );
}
