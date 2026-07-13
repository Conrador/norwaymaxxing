/**
 * Temporary local premium gate.
 *
 * Onboarding, paywall and entitlements will come back with monetization later.
 * Until then everything stays unlocked so dashboard and nested screens can be
 * polished without monetization blockers.
 */
export function usePremium() {
  return {
    isPremium: true,
    loading: false,
    reload: () => {},
  };
}
