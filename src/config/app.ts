/** Norway Score (0-100) od którego dzień liczy się do streaka. */
export const STREAK_SCORE_THRESHOLD = 60;

/** Lokalny welcome/onboarding/paywall przed wejściem do apki (onboarding_paywall.md). */
export const ONBOARDING_ENABLED = true;

/**
 * Plany subskrypcji (monetization-research.md §3-4). Dwa plany, BEZ weekly,
 * BEZ trialu. Yearly = kotwica (domyślnie zaznaczony). Zlokalizowane ceny
 * zawsze pochodzą z App Store przez Onborn billing.
 */

export type PlanId = 'yearly' | 'monthly';

export type SubscriptionPlan = {
  id: PlanId;
  /** store product id — do podłączenia billingu onborn */
  productId: string;
  /** klucz i18n nagłówka planu */
  titleKey: string;
  /** yearly dostaje badge „BEST VALUE" i jest domyślnie wybrany */
  highlighted: boolean;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'yearly', productId: 'norwaymaxxing_yearly', titleKey: 'paywall.yearly', highlighted: true },
  { id: 'monthly', productId: 'norwaymaxxing_monthly', titleKey: 'paywall.monthly', highlighted: false },
];

/** Annual product with a paid, one-year introductory offer unlocked by RO!. */
export const RO_REWARD_PRODUCT_ID =
  process.env.EXPO_PUBLIC_RO_REWARD_PRODUCT_ID?.trim() || 'norwaymaxx_yearly_ro20';

export const DEFAULT_PLAN_ID: PlanId = 'yearly';
