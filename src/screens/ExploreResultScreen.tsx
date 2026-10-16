import { useTranslation } from 'react-i18next';
import { MIN_COMPREHENSION_FOR_TARGET } from '../core/scoring';
import { useApp } from '../store/app';

export function ExploreResultScreen() {
  const { t } = useTranslation();
  const { exploreSummary: s, go } = useApp();
  if (!s) return null;

  const wpm = (value: number) => t('placementResult.unitWpm', { value });
  const stats = [
    { label: t('placementResult.speed'), value: wpm(s.wpm) },
    { label: t('placementResult.comprehension'), value: t('placementResult.percent', { value: Math.round(s.comprehension * 100) }) },
    { label: t('placementResult.effective'), value: wpm(s.effectiveWpm) },
  ];

  const message =
    s.comprehension < MIN_COMPREHENSION_FOR_TARGET
      ? t('exploreResult.lowComprehension')
      : s.score.targetBonus > 0
        ? t('exploreResult.targetReached')
        : t('exploreResult.targetMissed');

  const lines = [
    { label: t('exploreResult.base'), value: s.score.base },
    { label: t('exploreResult.targetBonus'), value: s.score.targetBonus },
    { label: t('exploreResult.perfectBonus'), value: s.score.perfectBonus },
    { label: t('exploreResult.streakBonus', { days: s.streakDays }), value: s.score.streakBonus },
  ].filter((l) => l.value > 0);

  return (
    <section className="screen">
      <div className="card center">
        <div className="treasure" aria-hidden>
          {s.score.targetBonus > 0 ? '💰' : '🧭'}
        </div>
        <h2>{t('exploreResult.title')}</h2>
        <p className="byline">{s.title}</p>
        <p className="speech">🦜 {message}</p>
        <dl className="stats">
          {stats.map((st) => (
            <div key={st.label}>
              <dt>{st.label}</dt>
              <dd>{st.value}</dd>
            </div>
          ))}
        </dl>
        {s.targetWpm !== null && (
          <p className="target">
            {t('placementResult.target')}: <strong>{wpm(s.targetWpm)}</strong>
          </p>
        )}
        {s.previousBest !== null && (
          <p>
            {s.effectiveWpm > s.previousBest
              ? `🏆 ${t('exploreResult.newRecord', { value: s.previousBest })}`
              : t('exploreResult.previousBest', { value: s.previousBest })}
          </p>
        )}
        <table className="score-table">
          <caption>{t('exploreResult.score')}</caption>
          <tbody>
            {lines.map((l) => (
              <tr key={l.label}>
                <th scope="row">{l.label}</th>
                <td>+{l.value}</td>
              </tr>
            ))}
            <tr className="total">
              <th scope="row">{t('exploreResult.total')}</th>
              <td>{s.score.total}</td>
            </tr>
          </tbody>
        </table>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => go('home')}>
            {t('exploreResult.home')}
          </button>
          <button type="button" className="btn primary" onClick={() => go('exploreSelect')}>
            {t('exploreResult.again')}
          </button>
        </div>
      </div>
    </section>
  );
}
