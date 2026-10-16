import { CreateProfileScreen } from './screens/CreateProfileScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PlacementResultScreen } from './screens/PlacementResultScreen';
import { PlacementScreen } from './screens/PlacementScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';
import { useApp } from './store/app';

export function App() {
  const screen = useApp((s) => s.screen);
  switch (screen) {
    case 'profiles':
      return <ProfilesScreen />;
    case 'createProfile':
      return <CreateProfileScreen />;
    case 'placement':
      return <PlacementScreen />;
    case 'placementResult':
      return <PlacementResultScreen />;
    case 'home':
      return <HomeScreen />;
  }
}
