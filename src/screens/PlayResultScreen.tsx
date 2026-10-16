import { useTranslation } from 'react-i18next';
import { MIN_COMPREHENSION_FOR_TARGET } from '../core/scoring';
import { useApp } from '../store/app';

export function PlayResultScreen() {
  const { t } = useTranslation();
  const { playSummary: s, go } = useApp();
  if (!s) return null;

  const wpm = (value: number) => t('placementResult.unitWpm', { value });
  const stats = [
    { label: t('placementResult.speed'), value: wpm(s.wpm) },
    { label: t('placementResult.comprehension'), value: t('placementResult.percent', { value: Math.round(s.comprehension * 100) }) },
    { label: t('placementResult.effective'), value: wpm(s.effectiveWpm) },
  ];

  const message =
    s.comprehension < MIN_COMPREHENSION_FOR_TARGET
      ? t('playResult.lowComprehension')
      : s.score.targetBonus > 0
        ? t('playResult.targetReached')
        : t('playResult.targetMissed');

  const lines = [
    { label: t('playResult.base', { multiplier: s.score.multiplier }), value: s.score.base },
    { label: t('playResult.targetBonus'), value: s.score.targetBonus },
    { label: t('playResult.perfectBonus'), value: s.score.perfectBonus },
    { label: t('playResult.streakBonus', { days: s.streakDays }), value: s.score.streakBonus },
  ].filter((l) => l.value > 0);

  const targetChange =
    s.previousTarget === null || s.newTarget === null
      ? null
      : s.newTarget > s.previousTarget
        ? t('playResult.targetUp', { from: s.previousTarget, to: s.newTarget })
        : s.newTarget < s.previousTarget
          ? t('playResult.targetDown', { from: s.previousTarget, to: s.newTarget })
          : t('playResult.targetSame', { value: s.newTarget });

  return (
    <section className="screen">
      <div className="card center">
        <div className="treasure" aria-hidden>
          {s.score.targetBonus > 0 ? '💰' : '🧭'}
        </div>
        <h2>{t('playResult.title')}</h2>
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
        {targetChange && <p className="target">{targetChange}</p>}
        {s.previousBest !== null && (
          <p>
            {s.effectiveWpm > s.previousBest
              ? `🏆 ${t('playResult.newRecord', { value: s.previousBest })}`
              : t('playResult.previousBest', { value: s.previousBest })}
          </p>
        )}
        <table className="score-table">
          <caption>{t('playResult.score')}</caption>
          <tbody>
            {lines.map((l) => (
              <tr key={l.label}>
                <th scope="row">{l.label}</th>
                <td>+{l.value}</td>
              </tr>
            ))}
            <tr className="total">
              <th scope="row">{t('playResult.total')}</th>
              <td>{s.score.total}</td>
            </tr>
          </tbody>
        </table>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => go('home')}>
            {t('playResult.home')}
          </button>
          <button type="button" className="btn primary" onClick={() => go('textSelect')}>
            {t('playResult.again')}
          </button>
        </div>
      </div>
    </section>
  );
}
