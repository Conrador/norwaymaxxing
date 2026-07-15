import type {
  ColdLevel,
  DietState,
  Goal,
  NatureAccess,
  SaunaAccess,
} from '@/stores/profile';
import type { SFSymbol } from 'expo-symbols';

/**
 * Quiz personalizacyjny (onboarding_paywall.md §4). Jedno pytanie na ekran,
 * opcje jako pigułki. Mapuje 1:1 na Profile. „goals" to multi-select (max 3),
 * reszta single-select.
 */

export type QuizKey = 'goals' | 'cold' | 'sauna' | 'nature' | 'diet';

export type QuizOption = {
  value: string;
  labelKey: string;
  symbol: SFSymbol;
};

export type QuizLayout =
  | 'goal-grid'
  | 'cold-scale'
  | 'sauna-access'
  | 'nature-bands'
  | 'diet-balance';

export type QuizQuestion = {
  key: QuizKey;
  titleKey: string;
  hintKey: string;
  layout: QuizLayout;
  multi: boolean;
  maxSelect?: number;
  options: QuizOption[];
};

export const QUIZ: QuizQuestion[] = [
  {
    key: 'goals',
    titleKey: 'onboarding.q.goals',
    hintKey: 'onboarding.qHint.goals',
    layout: 'goal-grid',
    multi: true,
    maxSelect: 3,
    options: [
      { value: 'energy', labelKey: 'onboarding.goal.energy', symbol: 'bolt.fill' },
      { value: 'resilience', labelKey: 'onboarding.goal.resilience', symbol: 'shield.fill' },
      { value: 'calm', labelKey: 'onboarding.goal.calm', symbol: 'brain.head.profile' },
      { value: 'sleep', labelKey: 'onboarding.goal.sleep', symbol: 'moon.stars.fill' },
      { value: 'physique', labelKey: 'onboarding.goal.physique', symbol: 'figure.strengthtraining.traditional' },
    ],
  },
  {
    key: 'cold',
    titleKey: 'onboarding.q.cold',
    hintKey: 'onboarding.qHint.cold',
    layout: 'cold-scale',
    multi: false,
    options: [
      { value: 'never', labelKey: 'onboarding.cold.never', symbol: 'drop.fill' },
      { value: 'sometimes', labelKey: 'onboarding.cold.sometimes', symbol: 'snowflake' },
      { value: 'regular', labelKey: 'onboarding.cold.regular', symbol: 'water.waves' },
    ],
  },
  {
    key: 'sauna',
    titleKey: 'onboarding.q.sauna',
    hintKey: 'onboarding.qHint.sauna',
    layout: 'sauna-access',
    multi: false,
    options: [
      { value: 'yes', labelKey: 'onboarding.sauna.yes', symbol: 'flame.fill' },
      { value: 'occasional', labelKey: 'onboarding.sauna.occasional', symbol: 'calendar' },
      { value: 'no', labelKey: 'onboarding.sauna.no', symbol: 'wind' },
    ],
  },
  {
    key: 'nature',
    titleKey: 'onboarding.q.nature',
    hintKey: 'onboarding.qHint.nature',
    layout: 'nature-bands',
    multi: false,
    options: [
      { value: 'forest', labelKey: 'onboarding.nature.forest', symbol: 'tree.fill' },
      { value: 'park', labelKey: 'onboarding.nature.park', symbol: 'leaf.fill' },
      { value: 'city', labelKey: 'onboarding.nature.city', symbol: 'building.2.fill' },
    ],
  },
  {
    key: 'diet',
    titleKey: 'onboarding.q.diet',
    hintKey: 'onboarding.qHint.diet',
    layout: 'diet-balance',
    multi: false,
    options: [
      { value: 'processed', labelKey: 'onboarding.diet.processed', symbol: 'takeoutbag.and.cup.and.straw.fill' },
      { value: 'mixed', labelKey: 'onboarding.diet.mixed', symbol: 'fork.knife' },
      { value: 'clean', labelKey: 'onboarding.diet.clean', symbol: 'carrot.fill' },
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
