import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { lazy, Suspense } from 'react';
import { CreateProfileScreen } from './screens/CreateProfileScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PlacementResultScreen } from './screens/PlacementResultScreen';
import { PlacementScreen } from './screens/PlacementScreen';
import { PlayResultScreen } from './screens/PlayResultScreen';
import { PlayScreen } from './screens/PlayScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';
import { TextSelectScreen } from './screens/TextSelectScreen';
import { TreasureScreen } from './screens/TreasureScreen';
import { useApp, type Screen } from './store/app';

// Charts are heavy; load them only when the progress screen is opened.
const ProgressScreen = lazy(() => import('./screens/ProgressScreen'));

function renderScreen(screen: Screen) {
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
    case 'textSelect':
      return <TextSelectScreen />;
    case 'play':
      return <PlayScreen />;
    case 'playResult':
      return <PlayResultScreen />;
    case 'treasure':
      return <TreasureScreen />;
    case 'progress':
      return (
        <Suspense fallback={null}>
          <ProgressScreen />
        </Suspense>
      );
  }
}

export function App() {
  const screen = useApp((s) => s.screen);
  // Opacity only: a transform here would break fixed/sticky children (glossary modal, reader toolbar).
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div key={screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {renderScreen(screen)}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
