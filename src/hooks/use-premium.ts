import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlanId } from '@/config/app';

type PremiumState = {
  isPremium: boolean;
  activePlan: PlanId | null;
  hasHydrated: boolean;
  activatePremium: (plan?: PlanId) => void;
  resetPremium: () => void;
  finishHydration: () => void;
};

const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      activePlan: null,
      hasHydrated: false,
      activatePremium: (activePlan = 'yearly') => set({ isPremium: true, activePlan }),
      resetPremium: () => set({ isPremium: false, activePlan: null }),
      finishHydration: () => set({ hasHydrated: true }),
    }),
    {
      name: 'premium-entitlement',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ isPremium, activePlan }) => ({ isPremium, activePlan }),
      onRehydrateStorage: () => (state) => {
        if (state) state.finishHydration();
        else usePremiumStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/** Local entitlement facade. Onborn can replace this implementation later. */
export function usePremium() {
  const isPremium = usePremiumStore((state) => state.isPremium);
  const activePlan = usePremiumStore((state) => state.activePlan);
  const hasHydrated = usePremiumStore((state) => state.hasHydrated);
  const activatePremium = usePremiumStore((state) => state.activatePremium);
  const resetPremium = usePremiumStore((state) => state.resetPremium);

  return {
    isPremium,
    activePlan,
    loading: !hasHydrated,
    activatePremium,
    resetPremium,
    reload: () => usePremiumStore.persist.rehydrate(),
  };
}
