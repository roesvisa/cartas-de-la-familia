/** Presentation only: never changes category, inventory or draw probabilities. */
export const cardMotion = { sensitivity: .45, threshold: 90, maxTilt: 6, flipMs: 580, returnMs: 350 };
export const cardFinish = { foilRest: .4, foilActive: .8, reflectionTravel: 35 };
export function visualRarity(category: string): 'common' | 'rare' | 'special' {
  const value = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const mapping: Record<string, 'common' | 'rare' | 'special'> = { comun: 'common', common: 'common', rara: 'rare', rare: 'rare', especial: 'special', special: 'special' };
  return mapping[value] ?? 'common';
}
export function gestureAngles(dx: number, dy: number, width: number) {
  return { y: dx / Math.max(1, width * cardMotion.sensitivity) * cardMotion.threshold,
    x: Math.max(-cardMotion.maxTilt, Math.min(cardMotion.maxTilt, -dy / Math.max(1, width) * 12)) };
}
