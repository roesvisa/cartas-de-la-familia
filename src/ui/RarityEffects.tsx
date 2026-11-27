import { visualRarity } from './cardVisualConfig';
import s from './PhysicalCard.module.css';
export function RarityEffects({ category }: { category: string }) {
  const rarity = visualRarity(category);
  if (rarity === 'common') return null;
  return <span className={s.effects} data-rarity={rarity} aria-hidden="true">
    <span className={s.foil} /><span className={s.reflection} /><span className={s.frame} />
  </span>;
}
