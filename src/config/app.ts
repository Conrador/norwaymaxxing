/** Norway Score (0-100) od którego dzień liczy się do streaka. */
export const STREAK_SCORE_THRESHOLD = 60;

/** Lokalny welcome/onboarding/paywall przed wejściem do apki (onboarding_paywall.md). */
export const ONBOARDING_ENABLED = true;

/**
 * Plany subskrypcji (monetization-research.md §3-4). Dwa plany, BEZ weekly,
 * BEZ trialu. Yearly = kotwica (domyślnie zaznaczony). Ceny poniżej to
 * PLACEHOLDERY do UI paywalla — finalne, zlokalizowane ceny dostarczy
 * App Store / onborn (płatności) w runtime. Ceny regionalne wg PPP, nie kursu.
 */

export type PlanId = 'yearly' | 'monthly';

export type PlanPrice = {
  /** cena główna w lokalnej walucie, gotowa do wyświetlenia */
  price: string;
  /** przeliczenie na tydzień (tylko yearly — anchoring) */
  perWeek?: string;
};

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
  { id: 'yearly', productId: 'norwaymaxx_yearly', titleKey: 'paywall.yearly', highlighted: true },
  { id: 'monthly', productId: 'norwaymaxx_monthly', titleKey: 'paywall.monthly', highlighted: false },
];

export const DEFAULT_PLAN_ID: PlanId = 'yearly';

/**
 * Placeholderowe ceny per region (PPP). `default` = storefront USD.
 * Klucz regionu = ISO kraju z expo-localization; brak dopasowania → default.
 */
export const PLAN_PRICES: Record<string, Record<PlanId, PlanPrice>> = {
  default: { yearly: { price: '$49.99', perWeek: '$0.96' }, monthly: { price: '$9.99' } },
  US: { yearly: { price: '$49.99', perWeek: '$0.96' }, monthly: { price: '$9.99' } },
  GB: { yearly: { price: '£44.99', perWeek: '£0.87' }, monthly: { price: '£8.99' } },
  PL: { yearly: { price: '149 zł', perWeek: '2,86 zł' }, monthly: { price: '34,99 zł' } },
  NO: { yearly: { price: '549 kr', perWeek: '10,56 kr' }, monthly: { price: '109 kr' } },
  SE: { yearly: { price: '599 kr', perWeek: '11,52 kr' }, monthly: { price: '119 kr' } },
  DK: { yearly: { price: '379 kr', perWeek: '7,29 kr' }, monthly: { price: '79 kr' } },
  // strefa euro (DE/FR/NL/IT/ES/PT) — jeden price-point na walutę
  EU: { yearly: { price: '49,99 €', perWeek: '0,96 €' }, monthly: { price: '9,99 €' } },
};

const EURO_COUNTRIES = ['DE', 'FR', 'NL', 'IT', 'ES', 'PT', 'AT', 'IE', 'FI', 'BE'];

/** Zwraca placeholderowe ceny dla kraju (ISO). Euro-kraje → wspólny tier EU. */
export function planPricesForRegion(country: string | null | undefined): Record<PlanId, PlanPrice> {
  if (!country) return PLAN_PRICES.default;
  if (PLAN_PRICES[country]) return PLAN_PRICES[country];
  if (EURO_COUNTRIES.includes(country)) return PLAN_PRICES.EU;
  return PLAN_PRICES.default;
}
