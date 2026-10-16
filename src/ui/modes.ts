import type { IslandId } from '../core/progress';
import type { GameMode } from '../store/app';
import type { Presentation } from './ReadingRun';

export const MODE_ICON: Record<IslandId, string> = {
  explore: '🏝️',
  pacer: '🌬️',
  rsvp: '⚡',
  voice: '🦇',
};

export const MODE_PRESENTATION: Record<GameMode, Presentation> = {
  explore: 'free',
  pacer: 'pacer',
  rsvp: 'rsvp',
};
