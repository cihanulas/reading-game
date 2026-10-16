import type { GameMode } from '../store/app';
import type { Presentation } from './ReadingRun';

export const MODE_ICON: Record<GameMode, string> = {
  explore: '🏝️',
  pacer: '🌬️',
  rsvp: '⚡',
};

export const MODE_PRESENTATION: Record<GameMode, Presentation> = {
  explore: 'free',
  pacer: 'pacer',
  rsvp: 'rsvp',
};
