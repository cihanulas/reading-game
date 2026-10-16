import { create } from 'zustand';
import type { ScoreBreakdown } from '../core/scoring';

export type Screen =
  | 'profiles'
  | 'createProfile'
  | 'placement'
  | 'placementResult'
  | 'home'
  | 'exploreSelect'
  | 'explore'
  | 'exploreResult';

export interface ExploreSummary {
  textId: string;
  title: string;
  wpm: number;
  comprehension: number;
  effectiveWpm: number;
  targetWpm: number | null;
  previousBest: number | null;
  streakDays: number;
  score: ScoreBreakdown;
}

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
  textId: string | null;
  exploreSummary: ExploreSummary | null;
  go: (screen: Screen) => void;
  selectProfile: (id: number, screen: Screen) => void;
  finishPlacement: (summary: PlacementSummary) => void;
  startExplore: (textId: string) => void;
  finishExplore: (summary: ExploreSummary) => void;
}

export const useApp = create<AppState>((set) => ({
  screen: 'profiles',
  profileId: null,
  placementSummary: null,
  textId: null,
  exploreSummary: null,
  go: (screen) => set({ screen }),
  selectProfile: (profileId, screen) => set({ profileId, screen }),
  finishPlacement: (placementSummary) => set({ placementSummary, screen: 'placementResult' }),
  startExplore: (textId) => set({ textId, screen: 'explore' }),
  finishExplore: (exploreSummary) => set({ exploreSummary, screen: 'exploreResult' }),
}));
