import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, Gift, LockKeyhole, Printer, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getActivityTexts, getLevelTexts } from '../content/loader';
import { isSuccessful, journeyProgress } from '../core/progress';
import { useSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { useApp } from '../store/app';
import { Celebration } from '../ui/Celebration';
import { IslandArt } from '../ui/GameArt';
import { playSound } from '../ui/sound';

const GIFTS = ['peanuts', 'gum', 'lollipop'] as const;

export function JourneyScreen() {
  const { t } = useTranslation();
  const { profileId, go, chooseMode, startPlay } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  const [revealed, setRevealed] = useState(false);
  if (!profile || !sessions) return null;

  const progress = journeyProgress(sessions, getLevelTexts(profile.lang, profile.ageGroup));
  const activities = getActivityTexts(profile.lang, profile.ageGroup);
  const completed = new Set(sessions.filter(isSuccessful).map((session) => session.textId));
  const gift = GIFTS[Math.abs(profile.createdAt + profile.id) % GIFTS.length];

  return (
    <section className="screen journey-screen">
      <header className="journey-heading">
        <div><span className="eyebrow">{t('app.title')}</span><h2>{t('journey.title')}</h2></div>
        <button type="button" className="btn ghost" onClick={() => go('home')}><ArrowLeft size={18} aria-hidden="true" />{t('journey.back')}</button>
      </header>
      <div className="journey-columns">
        {progress.complete ? (
          <article className="certificate" aria-labelledby="certificate-title">
            <Celebration grand />
            <span className="eyebrow">{t('app.title')}</span>
            <h2 id="certificate-title">{t('journey.certificate')}</h2>
            <p className="certificate-label">{t('journey.awardedTo')}</p>
            <strong className="certificate-name">{profile.name}</strong>
            <p className="certificate-achievement">{t('journey.achievement', { count: progress.total })}</p>
            {revealed ? (
              <div className="certificate-gift" role="status">
                <Gift size={26} aria-hidden="true" />
                <strong>{t('journey.giftWon', { gift: t(`journey.gifts.${gift}`) })}</strong>
                <p>{t('journey.showParent')}</p>
              </div>
            ) : (
              <button type="button" className="btn primary gift-reveal" onClick={() => { setRevealed(true); playSound('chest'); }}>
                <Gift size={22} aria-hidden="true" />{t('journey.openGift')}
              </button>
            )}
            <p className="certificate-note">{t('journey.parentNote')}</p>
            {revealed && <button type="button" className="btn ghost certificate-print" onClick={() => window.print()}><Printer size={18} aria-hidden="true" />{t('journey.print')}</button>}
          </article>
        ) : (
          <div className="journey-checklist">
            <IslandArt kind="explore" />
            <h2>{t('journey.locked', { count: progress.total - progress.done })}</h2>
            <p>{t('journey.progress', progress)}</p>
            <progress value={progress.done} max={progress.total || 1} aria-label={t('journey.title')} />
            <ul>
              {progress.levels.map((level) => <li key={level.level}>
                {level.done === level.total ? <CheckCircle2 size={20} aria-hidden="true" /> : <Compass size={20} aria-hidden="true" />}
                <span>{t('textSelect.level', { level: level.level })}</span><strong>{level.done} / {level.total}</strong>
              </li>)}
            </ul>
            <button type="button" className="btn primary" onClick={() => chooseMode('explore')}><BookOpen size={18} aria-hidden="true" />{t('journey.continue')}</button>
          </div>
        )}
        <div className="journey-activities">
          <span className="eyebrow">{t('journey.continue')}</span>
          <h2>{t('journey.activities')}</h2>
          <p>{t(progress.complete ? 'journey.activitiesMessage' : 'journey.activityLocked')}</p>
          <div className="activity-list">
            {activities.map((text) => (
              <article key={text.id} className={`activity-tile activity-${text.activity}`}>
                <div className="activity-symbol" aria-hidden="true">{text.activity === 'detective' ? <Search /> : <Sparkles />}</div>
                <div>
                  <span className="eyebrow">{t(`journey.${text.activity}`)}</span>
                  <h3>{text.title}</h3>
                  <p>{t('textSelect.words', { count: text.wordCount })}{completed.has(text.id) && <> · {t('journey.activityDone')}</>}</p>
                </div>
                <button type="button" className="btn" disabled={!progress.complete} onClick={() => { chooseMode('explore'); startPlay(text.id); }}>
                  {progress.complete ? <ArrowRight size={18} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}
                  {t(completed.has(text.id) ? 'journey.readAgain' : 'journey.read')}
                </button>
              </article>
            ))}
          </div>
          {progress.complete && <div className="journey-next">
            <h3>{t('journey.nextChallenge')}</h3>
            <p>{t('journey.challengeMessage')}</p>
            <button type="button" className="btn ghost" onClick={() => go('home')}><Compass size={18} aria-hidden="true" />{t('journey.back')}</button>
          </div>}
        </div>
      </div>
    </section>
  );
}