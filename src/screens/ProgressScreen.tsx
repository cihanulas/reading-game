import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { progressSeries, progressSummary, type ProgressPoint } from '../core/stats';
import { useSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { GAME_MODES, useApp, type GameMode } from '../store/app';
import { MODE_ICON } from '../ui/modes';

type Filter = GameMode | 'all';

export default function ProgressScreen() {
  const { t, i18n } = useTranslation();
  const { profileId, go } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  const [filter, setFilter] = useState<Filter>('all');
  const data = useMemo(() => progressSeries(sessions ?? [], filter), [sessions, filter]);
  const summary = useMemo(() => progressSummary(sessions ?? []), [sessions]);
  if (!profile || !sessions) return null;

  const date = (ms: number) => new Date(ms).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  const filters: Filter[] = ['all', ...GAME_MODES];

  return (
    <section className="screen">
      <div className="card">
        <h2>📈 {t('progress.title')}</h2>
        <dl className="stats">
          <div>
            <dt>{t('progress.reads')}</dt>
            <dd>{summary.reads}</dd>
          </div>
          <div>
            <dt>{t('progress.best')}</dt>
            <dd>{t('placementResult.unitWpm', { value: summary.bestEffective })}</dd>
          </div>
          <div>
            <dt>{t('progress.recentComprehension')}</dt>
            <dd>{t('placementResult.percent', { value: Math.round(summary.recentComprehension * 100) })}</dd>
          </div>
          <div>
            <dt>{t('progress.gain')}</dt>
            <dd>
              {summary.effectiveGain > 0 ? '+' : ''}
              {t('placementResult.unitWpm', { value: summary.effectiveGain })}
            </dd>
          </div>
        </dl>

        <div className="chips" role="group" aria-label={t('progress.filter')}>
          {filters.map((f) => (
            <button key={f} type="button" className={`btn chip ${filter === f ? 'selected' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? t('progress.all') : `${MODE_ICON[f]} ${t(`modes.${f}.title`)}`}
            </button>
          ))}
        </div>

        {data.length < 2 ? (
          <p className="speech">🦜 {t('progress.empty')}</p>
        ) : (
          <div className="chart" role="img" aria-label={t('progress.chartLabel', { count: data.length })}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d29d" />
                <XAxis dataKey="n" tickFormatter={(n: number) => date(data[n - 1]?.createdAt ?? 0)} minTickGap={20} />
                <YAxis />
                <Tooltip
                  labelFormatter={(n) => {
                    const p: ProgressPoint | undefined = data[Number(n) - 1];
                    return p ? `${date(p.createdAt)} · ${t(`progress.mode.${p.mode}`)} · ${t('placementResult.percent', { value: p.comprehension })}` : '';
                  }}
                />
                <Legend />
                {profile.targetWpm !== null && (
                  <ReferenceLine y={profile.targetWpm} stroke="#e5604a" strokeDasharray="6 4" label={t('progress.target')} />
                )}
                <Line type="monotone" dataKey="wpm" name={t('progress.wpm')} stroke="#0b6e99" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="effectiveWpm" name={t('progress.effective')} stroke="#2e9e4f" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="row">
          <button type="button" className="btn ghost" onClick={() => go('home')}>
            {t('progress.back')}
          </button>
        </div>
      </div>
    </section>
  );
}
