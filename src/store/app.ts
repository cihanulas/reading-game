import { create } from 'zustand';

export type Screen = 'profiles' | 'createProfile' | 'placement' | 'placementResult' | 'home';

export interface PlacementSummary {
  wpm: number;
  comprehension: number;
  effectiveWpm: number;
  targetWpm: number;
}

interface AppState {
  screen: Screen;
  profileId: number | null;
  placementSummary: PlacementSummary | null;
  go: (screen: Screen) => void;
  selectProfile: (id: number, screen: Screen) => void;
  finishPlacement: (summary: PlacementSummary) => void;
}

export const useApp = create<AppState>((set) => ({
  screen: 'profiles',
  profileId: null,
  placementSummary: null,
  go: (screen) => set({ screen }),
  selectProfile: (profileId, screen) => set({ profileId, screen }),
  finishPlacement: (placementSummary) => set({ placementSummary, screen: 'placementResult' }),
}));
