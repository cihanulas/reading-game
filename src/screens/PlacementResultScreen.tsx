import { useTranslation } from 'react-i18next';
import { useApp } from '../store/app';

export function PlacementResultScreen() {
  const { t } = useTranslation();
  const { placementSummary: s, go } = useApp();
  if (!s) return null;

  const stats = [
    { label: t('placementResult.speed'), value: t('placementResult.unitWpm', { value: s.wpm }) },
    { label: t('placementResult.comprehension'), value: t('placementResult.percent', { value: Math.round(s.comprehension * 100) }) },
    { label: t('placementResult.effective'), value: t('placementResult.unitWpm', { value: s.effectiveWpm }) },
  ];

  return (
    <section className="screen">
      <div className="card center">
        <div className="treasure" aria-hidden>
          🗺️
        </div>
        <h2>{t('placementResult.title')}</h2>
        <dl className="stats">
          {stats.map((st) => (
            <div key={st.label}>
              <dt>{st.label}</dt>
              <dd>{st.value}</dd>
            </div>
          ))}
        </dl>
        <p className="target">
          {t('placementResult.target')}: <strong>{t('placementResult.unitWpm', { value: s.targetWpm })}</strong>
        </p>
        <button type="button" className="btn primary big" onClick={() => go('home')}>
          {t('placementResult.continue')}
        </button>
      </div>
    </section>
  );
}
