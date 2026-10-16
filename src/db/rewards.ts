import { useCallback, useEffect, useState } from 'react';
import { pickReward, type ChestReward } from '../core/progress';
import type { LangCode } from '../lang';
import { db, type Reward } from './db';

export function getRewards(profileId: number, lang: LangCode): Promise<Reward[]> {
  return db.rewards.where('[profileId+lang]').equals([profileId, lang]).toArray();
}

export function useRewards(profileId: number | undefined, lang: LangCode | undefined) {
  const [rewards, setRewards] = useState<Reward[]>();
  const reload = useCallback(async () => {
    if (profileId === undefined || lang === undefined) return;
    setRewards(await getRewards(profileId, lang));
  }, [profileId, lang]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { rewards, reload };
}

/** Opens one chest and stores what was inside. */
export async function openChest(profileId: number, lang: LangCode, owned: readonly string[]): Promise<ChestReward> {
  const reward = pickReward(owned);
  await db.rewards.add({ profileId, lang, itemId: reward.itemId, coins: reward.coins, createdAt: Date.now() });
  return reward;
}
