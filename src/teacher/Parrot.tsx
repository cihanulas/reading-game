import { CharacterArt } from '../ui/GameArt';
import type { AvatarGesture, AvatarMood } from '../../ogretmen/src/types';

export function Parrot({ mood = 'explaining', gesture = 'none', talking }: { mood?: AvatarMood; gesture?: AvatarGesture; talking: boolean }) {
  return (
    <div className={`teacher-parrot mood-${mood} gesture-${gesture} ${talking ? 'talking' : ''}`} aria-hidden="true">
      <CharacterArt value="🦜" />
    </div>
  );
}
