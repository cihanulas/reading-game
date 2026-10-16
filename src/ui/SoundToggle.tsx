import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isSoundOn, playSound, setSoundOn } from './sound';

export function SoundToggle() {
  const { t } = useTranslation();
  const [on, setOn] = useState(isSoundOn);

  const toggle = () => {
    setSoundOn(!on);
    setOn(!on);
    if (!on) playSound('tap');
  };

  return (
    <button type="button" className="btn round ghost" onClick={toggle} aria-pressed={on} aria-label={t('sound.toggle')}>
      {on ? '🔊' : '🔇'}
    </button>
  );
}
