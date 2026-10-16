import { create } from 'zustand';
import type { BadgeId, IslandId } from '../core/progress';
import type { ScoreBreakdown } from '../core/scoring';
import type { VoiceStats } from '../ui/VoiceReader';

export type Screen =
  | 'profiles'
  | 'createProfile'
  | 'placement'
  | 'placementResult'
  | 'home'
  | 'textSelect'
  | 'play'
  | 'playResult'
  | 'treasure'
  | 'progress';

/** Island game modes available from the home screen. */
export type GameMode = 'explore' | 'pacer' | 'rsvp' | 'voice';
export const GAME_MODES: GameMode[] = ['explore', 'pacer', 'rsvp', 'voice'];

export interface PlacementSummary {
  wpm: number;
  comprehension: number;
  effectiveWpm: number;
  targetWpm: number;
}

export interface PlaySummary {
  mode: GameMode;
  textId: string;
  title: string;
  wpm: number;
  comprehension: number;
  effectiveWpm: number;
  previousTarget: number | null;
  newTarget: number | null;
  previousBest: number | null;
  streakDays: number;
  score: ScoreBreakdown;
  newBadges: BadgeId[];
  newIslands: IslandId[];
  /** True when this read completed a chest. */
  chestEarned: boolean;
  /** Map pieces collected toward the next chest. */
  pieces: number;
  /** Read-aloud details (Yankı Mağarası only). */
  voice?: VoiceStats;
}

interface AppState {
  screen: Screen;
  profileId: number | null;
  placementSummary: PlacementSummary | null;
  mode: GameMode;
  textId: string | null;
  playSummary: PlaySummary | null;
  go: (screen: Screen) => void;
  selectProfile: (id: number, screen: Screen) => void;
  finishPlacement: (summary: PlacementSummary) => void;
  chooseMode: (mode: GameMode) => void;
  startPlay: (textId: string) => void;
  finishPlay: (summary: PlaySummary) => void;
}

export const useApp = create<AppState>((set) => ({
  screen: 'profiles',
  profileId: null,
  placementSummary: null,
  mode: 'explore',
  textId: null,
  playSummary: null,
  go: (screen) => set({ screen }),
  selectProfile: (profileId, screen) => set({ profileId, screen }),
  finishPlacement: (placementSummary) => set({ placementSummary, screen: 'placementResult' }),
  chooseMode: (mode) => set({ mode, screen: 'textSelect' }),
  startPlay: (textId) => set({ textId, screen: 'play' }),
  finishPlay: (playSummary) => set({ playSummary, screen: 'playResult' }),
}));
