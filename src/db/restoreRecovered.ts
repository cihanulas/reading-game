import { db } from './db';
import { recoveredProfile, recoveredRewards, recoveredSessions } from './recoveredProfile';

const FLAG = 'okuma.recoveredProfile.v1';

let pending: Promise<void> | null = null;

/**
 * The old captain lives in Chrome under http://127.0.0.1:5173.
 * localhost and the LAN address are separate databases, so a later start looked empty.
 * Copy the saved history once, and only when this address has no captains yet.
 */
export function restoreRecoveredProfile(): Promise<void> {
  if (!pending) pending = run();
  return pending;
}

async function run(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(FLAG)) return;
  if ((await db.profiles.count()) > 0) {
    localStorage.setItem(FLAG, 'skip');
    return;
  }
  await db.transaction('rw', db.profiles, db.sessions, db.rewards, async () => {
    const profileId = await db.profiles.add(recoveredProfile);
    await db.sessions.bulkAdd(recoveredSessions.map((session) => ({ ...session, profileId })));
    await db.rewards.bulkAdd(recoveredRewards.map((reward) => ({ ...reward, profileId })));
  });
  localStorage.setItem(FLAG, 'done');
}
