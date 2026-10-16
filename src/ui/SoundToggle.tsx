import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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
    <button type="button" className="btn round ghost" onClick={toggle} aria-pressed={on} aria-label={t('sound.toggle')} title={t('sound.toggle')}>
      {on ? <Volume2 size={21} aria-hidden="true" /> : <VolumeX size={21} aria-hidden="true" />}
    </button>
  );
}
