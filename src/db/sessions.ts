import { useEffect, useState } from 'react';
import type { LangCode } from '../lang';
import { db, type ReadingSession } from './db';

export function getSessions(profileId: number, lang: LangCode): Promise<ReadingSession[]> {
  return db.sessions.where('[profileId+lang]').equals([profileId, lang]).toArray();
}

export function useSessions(profileId: number | undefined, lang: LangCode | undefined): ReadingSession[] | undefined {
  const [sessions, setSessions] = useState<ReadingSession[]>();
  useEffect(() => {
    if (profileId === undefined || lang === undefined) return;
    let alive = true;
    getSessions(profileId, lang).then((s) => alive && setSessions(s));
    return () => {
      alive = false;
    };
  }, [profileId, lang]);
  return sessions;
}
