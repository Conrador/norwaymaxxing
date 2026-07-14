import type {
  ColdLevel,
  DietState,
  Goal,
  NatureAccess,
  SaunaAccess,
} from '@/stores/profile';

/**
 * Quiz personalizacyjny (onboarding_paywall.md §4). Jedno pytanie na ekran,
 * opcje jako pigułki. Mapuje 1:1 na Profile. „goals" to multi-select (max 3),
 * reszta single-select.
 */

export type QuizKey = 'goals' | 'cold' | 'sauna' | 'nature' | 'diet';

export type QuizOption = {
  value: string;
  labelKey: string;
  emoji: string;
};

export type QuizQuestion = {
  key: QuizKey;
  titleKey: string;
  multi: boolean;
  maxSelect?: number;
  options: QuizOption[];
};

export const QUIZ: QuizQuestion[] = [
  {
    key: 'goals',
    titleKey: 'onboarding.q.goals',
    multi: true,
    maxSelect: 3,
    options: [
      { value: 'energy', labelKey: 'onboarding.goal.energy', emoji: '⚡' },
      { value: 'resilience', labelKey: 'onboarding.goal.resilience', emoji: '❄️' },
      { value: 'calm', labelKey: 'onboarding.goal.calm', emoji: '🧠' },
      { value: 'sleep', labelKey: 'onboarding.goal.sleep', emoji: '😴' },
      { value: 'physique', labelKey: 'onboarding.goal.physique', emoji: '🪓' },
    ],
  },
  {
    key: 'cold',
    titleKey: 'onboarding.q.cold',
    multi: false,
    options: [
      { value: 'never', labelKey: 'onboarding.cold.never', emoji: '🚿' },
      { value: 'sometimes', labelKey: 'onboarding.cold.sometimes', emoji: '🥶' },
      { value: 'regular', labelKey: 'onboarding.cold.regular', emoji: '🧊' },
    ],
  },
  {
    key: 'sauna',
    titleKey: 'onboarding.q.sauna',
    multi: false,
    options: [
      { value: 'yes', labelKey: 'onboarding.sauna.yes', emoji: '🔥' },
      { value: 'occasional', labelKey: 'onboarding.sauna.occasional', emoji: '♨️' },
      { value: 'no', labelKey: 'onboarding.sauna.no', emoji: '🚫' },
    ],
  },
  {
    key: 'nature',
    titleKey: 'onboarding.q.nature',
    multi: false,
    options: [
      { value: 'forest', labelKey: 'onboarding.nature.forest', emoji: '🌲' },
      { value: 'park', labelKey: 'onboarding.nature.park', emoji: '🏞️' },
      { value: 'city', labelKey: 'onboarding.nature.city', emoji: '🏙️' },
    ],
  },
  {
    key: 'diet',
    titleKey: 'onboarding.q.diet',
    multi: false,
    options: [
      { value: 'processed', labelKey: 'onboarding.diet.processed', emoji: '🍟' },
      { value: 'mixed', labelKey: 'onboarding.diet.mixed', emoji: '🍽️' },
      { value: 'clean', labelKey: 'onboarding.diet.clean', emoji: '🥩' },
    ],
  },
];

/** Zbiera surowe odpowiedzi quizu w typowany Profile. */
export function answersToProfile(answers: Record<QuizKey, string[]>): {
  goals: Goal[];
  coldLevel: ColdLevel;
  saunaAccess: SaunaAccess;
  natureAccess: NatureAccess;
  diet: DietState;
} {
  return {
    goals: (answers.goals ?? []) as Goal[],
    coldLevel: (answers.cold?.[0] ?? 'never') as ColdLevel,
    saunaAccess: (answers.sauna?.[0] ?? 'occasional') as SaunaAccess,
    natureAccess: (answers.nature?.[0] ?? 'park') as NatureAccess,
    diet: (answers.diet?.[0] ?? 'mixed') as DietState,
  };
}
