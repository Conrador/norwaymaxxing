/**
 * Conservative editorial stages for a cold-shower habit challenge. The 30/60/90
 * second values have been studied, but no trial establishes an optimal
 * progression. These are adherence defaults, not a medical dose.
 */

export const COLD_PLAN_DAYS = 30;
export const FREE_COLD_DAYS = 3;

export function coldDurationSeconds(day: number): number {
  const clamped = Math.min(Math.max(day, 1), COLD_PLAN_DAYS);
  if (clamped <= 7) return 30;
  if (clamped <= 14) return 45;
  if (clamped <= 21) return 60;
  if (clamped <= 27) return 75;
  return 90;
}

export function isColdDayPremium(day: number): boolean {
  return day > FREE_COLD_DAYS;
}

/** Standalone box-breathing session used by the general Breath practice. */
export const BREATH_PHASE_SECONDS = 4;
export const BREATH_ROUNDS = 4;
export const BREATH_PHASES = ['inhale', 'holdIn', 'exhale', 'holdOut'] as const;
export type BreathPhase = (typeof BREATH_PHASES)[number];

/** Continuous breathing used only before cold: no holds or hyperventilation. */
export const COLD_BREATH_PHASES = [
  { phase: 'inhale', seconds: 4 },
  { phase: 'exhale', seconds: 6 },
] as const;
export const COLD_BREATH_ROUNDS = 4;
