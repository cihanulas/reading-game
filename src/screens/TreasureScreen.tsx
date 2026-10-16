import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BADGE_ICON,
  BADGES,
  chestsEarned,
  earnedBadges,
  ITEM_ICON,
  ITEMS,
  mapPieces,
  PIECES_PER_CHEST,
  type ChestReward,
} from '../core/progress';
import { openChest, useRewards } from '../db/rewards';
import { useSessions } from '../db/sessions';
import { useProfile } from '../db/useProfile';
import { useApp } from '../store/app';
import { playSound } from '../ui/sound';

export function TreasureScreen() {
  const { t } = useTranslation();
  const { profileId, go } = useApp();
  const profile = useProfile(profileId);
  const sessions = useSessions(profile?.id, profile?.lang);
  const { rewards, reload } = useRewards(profile?.id, profile?.lang);
  const [opening, setOpening] = useState(false);
  const [found, setFound] = useState<ChestReward | null>(null);
  if (!profile || !sessions || !rewards) return null;

  const owned = rewards.flatMap((r) => (r.itemId ? [r.itemId] : []));
  const unopened = chestsEarned(sessions) - rewards.length;
  const pieces = mapPieces(sessions) % PIECES_PER_CHEST;
  const badges = earnedBadges(sessions);

  const open = async () => {
    if (opening || unopened <= 0) return;
    setFound(null);
    setOpening(true);
    playSound('tap');
    const [reward] = await Promise.all([openChest(profile.id, profile.lang, owned), new Promise((r) => setTimeout(r, 900))]);
    playSound('chest');
    await reload();
    setFound(reward);
    setOpening(false);
  };

  return (
    <section className="screen">
      <div className="card center">
        <h2>🧰 {t('treasure.title')}</h2>

        <div className="chest-stage">
          <motion.div
            className="chest"
            aria-hidden
            animate={opening ? { rotate: [0, -12, 12, -12, 12, 0], scale: [1, 1.1, 1.1, 1.2, 1.2, 1] } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.9 }}
          >
            {unopened > 0 || opening ? '🧰' : '🏝️'}
          </motion.div>
          <AnimatePresence>
            {found && (
              <motion.p
                key={rewards.length}
                className="found"
                initial={{ y: 30, scale: 0, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 12 }}
              >
                {found.itemId ? (
                  <>
                    <span className="found-icon">{ITEM_ICON[found.itemId]}</span>
                    {t('treasure.foundItem', { item: t(`items.${found.itemId}`) })}
                  </>
                ) : (
                  <>
                    <span className="found-icon">🪙</span>
                    {t('treasure.foundGold', { count: found.coins })}
                  </>
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {unopened > 0 ? (
          <button type="button" className="btn primary big" onClick={() => void open()} disabled={opening}>
            {t('treasure.open', { count: unopened })}
          </button>
        ) : (
          <p className="speech">🦜 {t('treasure.noChest', { count: pieces, total: PIECES_PER_CHEST })}</p>
        )}

        <h3>{t('treasure.collection', { owned: new Set(owned).size, total: ITEMS.length })}</h3>
        <ul className="collection">
          {ITEMS.map(({ id, icon }) => {
            const has = owned.includes(id);
            return (
              <li key={id} className={has ? '' : 'missing'} title={has ? t(`items.${id}`) : undefined}>
                <span aria-hidden>{has ? icon : '❔'}</span>
                <small>{has ? t(`items.${id}`) : t('treasure.unknown')}</small>
              </li>
            );
          })}
        </ul>

        <h3>{t('treasure.badges', { owned: badges.length, total: BADGES.length })}</h3>
        <ul className="badge-grid">
          {BADGES.map((id) => {
            const has = badges.includes(id);
            return (
              <li key={id} className={has ? 'earned' : 'missing'}>
                <span className="badge-icon" aria-hidden>
                  {BADGE_ICON[id]}
                </span>
                <strong>{t(`badges.${id}.title`)}</strong>
                <small>{t(`badges.${id}.desc`)}</small>
              </li>
            );
          })}
        </ul>

        <div className="row">
          <button type="button" className="btn ghost" onClick={() => go('home')}>
            {t('treasure.back')}
          </button>
        </div>
      </div>
    </section>
  );
}
