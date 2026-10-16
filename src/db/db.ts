import Dexie, { type EntityTable } from 'dexie';
import type { AgeGroup, LangCode } from '../lang';

export interface Profile {
  id: number;
  name: string;
  avatar: string;
  ageGroup: AgeGroup;
  lang: LangCode;
  /** null until the placement test is completed. */
  targetWpm: number | null;
  createdAt: number;
}

export type ReadingMode = 'placement' | 'explore' | 'pacer' | 'rsvp' | 'voice';

export interface ReadingSession {
  id: number;
  profileId: number;
  lang: LangCode;
  textId: string;
  mode: ReadingMode;
  wordCount: number;
  activeMs: number;
  wpm: number;
  comprehension: number;
  effectiveWpm: number;
  /** Points earned; 0 for placement sessions. */
  score: number;
  createdAt: number;
}

export const db = new Dexie('okuma-adasi') as Dexie & {
  profiles: EntityTable<Profile, 'id'>;
  sessions: EntityTable<ReadingSession, 'id'>;
};

db.version(1).stores({
  profiles: '++id, createdAt',
  sessions: '++id, [profileId+lang], createdAt',
});
