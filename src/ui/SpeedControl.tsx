import { useTranslation } from 'react-i18next';
import { clampWpm, WPM_STEP } from '../core/pacing';

interface Props {
  value: number;
  onChange: (wpm: number) => void;
}

export function SpeedControl({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="speed-control" role="group" aria-label={t('speed.label')}>
      <button type="button" className="btn round" onClick={() => onChange(clampWpm(value - WPM_STEP))} aria-label={t('speed.slower')}>
        −
      </button>
      <output className="speed-value">{t('speed.value', { value })}</output>
      <button type="button" className="btn round" onClick={() => onChange(clampWpm(value + WPM_STEP))} aria-label={t('speed.faster')}>
        +
      </button>
    </div>
  );
}
