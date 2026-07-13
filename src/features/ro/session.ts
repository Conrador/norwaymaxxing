/**
 * RO! — Viking Row (ro-activity.md). Jeden „rep" = DWA uderzenia w bęben
 * (dun-dun), a dopiero po drugim tłum odpowiada „RO!". Po zamknięciu pary
 * zaczyna się odliczanie do pierwszego uderzenia kolejnej pary.
 */

export type RoTier = {
  /** liczba repów (każdy = podwójne uderzenie + odpowiedź tłumu) */
  reps: number;
  bpmStart: number;
  bpmEnd: number;
};

/** Trudność rośnie z dniem planu zimna (ro-activity.md §3.2). */
export function roTier(coldPlanDay: number): RoTier {
  if (coldPlanDay >= 20) return { reps: 12, bpmStart: 36, bpmEnd: 112 };
  if (coldPlanDay >= 10) return { reps: 10, bpmStart: 34, bpmEnd: 92 };
  return { reps: 8, bpmStart: 32, bpmEnd: 72 };
}

/**
 * Pauza (ms) od drugiego uderzenia ukończonej pary do pierwszego uderzenia
 * kolejnej. Zwracamy jeden target na każdy rep, włącznie z countdownem otwierającym.
 */
export function repIntervalsMs(tier: RoTier): number[] {
  const steps = tier.reps;
  const ratio = tier.bpmEnd / tier.bpmStart;
  return Array.from({ length: steps }, (_, i) => {
    const bpm = tier.bpmStart * Math.pow(ratio, steps <= 1 ? 1 : i / (steps - 1));
    return 60000 / bpm;
  });
}

/** Kadencja dun-dun zmierzona z materiału referencyjnego; UX nie pokazuje tu timera. */
export const RO_DOUBLE_TAP_MS = 420;
/** Okno trafienia pierwszego uderzenia kolejnej pary. */
export const RO_HIT_WINDOW_MS = 260;
/** Pierwsze repy bez oceny — kalibracja usera. */
export const RO_WARMUP_REPS = 3;
/** Hint pokazujemy najwyżej raz na tyle repów. */
export const RO_HINT_COOLDOWN_REPS = 2;
/** Próg energii tłumu dla pełnego XP. */
export const RO_ENERGY_THRESHOLD = 0.6;
export const RO_XP_FULL = 25;
export const RO_XP_PARTIAL = 15;
/** Opóźnienie odpowiedzi tłumu po drugim uderzeniu — wyraźne „dun-dun → RUUU". */
export const RO_CROWD_DELAY_MS = 190;

export type RoBeatJudgement = 'hit' | 'slow' | 'fast';

export function judgeRep(actualIntervalMs: number, targetIntervalMs: number): RoBeatJudgement {
  if (actualIntervalMs > targetIntervalMs + RO_HIT_WINDOW_MS) return 'slow';
  if (actualIntervalMs < targetIntervalMs - RO_HIT_WINDOW_MS) return 'fast';
  return 'hit';
}

/** Kolory confetti = flaga Norwegii (ro-activity.md §7). */
export const RO_CONFETTI_COLORS = ['#BA0C2F', '#FFFFFF', '#00205B'];
