import { CreateProfileScreen } from './screens/CreateProfileScreen';
import { ExploreResultScreen } from './screens/ExploreResultScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { ExploreSelectScreen } from './screens/ExploreSelectScreen';
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
    case 'exploreSelect':
      return <ExploreSelectScreen />;
    case 'explore':
      return <ExploreScreen />;
    case 'exploreResult':
      return <ExploreResultScreen />;
  }
}
