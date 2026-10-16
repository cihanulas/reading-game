import { useEffect, useState } from 'react';
import { db, type Profile } from '../db/db';

export function useProfile(id: number | null): Profile | undefined {
  const [profile, setProfile] = useState<Profile>();
  useEffect(() => {
    if (id === null) return;
    let alive = true;
    db.profiles.get(id).then((p) => alive && setProfile(p));
    return () => {
      alive = false;
    };
  }, [id]);
  return profile;
}
