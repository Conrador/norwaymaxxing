export const FREE_NATURE_CHALLENGE_IDS = new Set([
  'forest-hour',
  'sunrise-walk',
  'barefoot-sensory-walk',
  'cold-water-face',
  'lake-dip',
]);

export function isNatureChallengePremium(id: string | undefined) {
  return Boolean(id && !FREE_NATURE_CHALLENGE_IDS.has(id));
}

export function isSaunaProtocolPremium(id: string) {
  return id !== 'beginner';
}

export function isDietDayPremium(index: number) {
  return index > 0;
}

/**
 * Moduły dostępne WYŁĄCZNIE w premium — w każdym kontekście (protokół i
 * biblioteka). RO! (Viking Row) pozostaje aktywnością dla subskrybentów.
 * Linki do zewnętrznych serwisów muzycznych nie mogą być gejtowane zakupem.
 */
export const PREMIUM_ONLY_MODULES = new Set(['ro']);

export function isPremiumOnlyModule(module: string) {
  return PREMIUM_ONLY_MODULES.has(module);
}
