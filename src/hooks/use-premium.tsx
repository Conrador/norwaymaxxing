import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useOnbornEntitlements,
  type CustomerEntitlement,
} from '@onborn/billing';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlanId } from '@/config/app';
import { ONBORN_PREMIUM_ENTITLEMENT_KEY } from '@/config/onborn';

type PremiumState = {
  isPremium: boolean;
  activePlan: PlanId | null;
  hasHydrated: boolean;
  syncEntitlements: (entitlements: CustomerEntitlement[], plan?: PlanId) => boolean;
  resetPremium: () => void;
  finishHydration: () => void;
};

type PremiumContextValue = {
  isPremium: boolean;
  activePlan: PlanId | null;
  loading: boolean;
  error: string | null;
  syncEntitlements: (entitlements: CustomerEntitlement[], plan?: PlanId) => boolean;
  resetPremium: () => void;
  reload: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

function hasPremiumEntitlement(entitlements: CustomerEntitlement[]) {
  return entitlements.some(
    (item) => item.active &&
      (item.key === ONBORN_PREMIUM_ENTITLEMENT_KEY ||
        item.entitlementId === ONBORN_PREMIUM_ENTITLEMENT_KEY),
  );
}

const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      activePlan: null,
      hasHydrated: false,
      syncEntitlements: (entitlements, plan) => {
        const isPremium = hasPremiumEntitlement(entitlements);
        set({
          isPremium,
          activePlan: isPremium ? (plan ?? get().activePlan) : null,
        });
        return isPremium;
      },
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

export function PremiumProvider({
  children,
  onbornEnabled,
}: {
  children: ReactNode;
  onbornEnabled: boolean;
}) {
  if (onbornEnabled) {
    return <RemotePremiumProvider>{children}</RemotePremiumProvider>;
  }

  return <LocalPremiumProvider>{children}</LocalPremiumProvider>;
}

function useLocalPremiumValue() {
  const isPremium = usePremiumStore((state) => state.isPremium);
  const activePlan = usePremiumStore((state) => state.activePlan);
  const hasHydrated = usePremiumStore((state) => state.hasHydrated);
  const syncEntitlements = usePremiumStore((state) => state.syncEntitlements);
  const resetPremium = usePremiumStore((state) => state.resetPremium);

  return { isPremium, activePlan, hasHydrated, syncEntitlements, resetPremium };
}

function LocalPremiumProvider({ children }: { children: ReactNode }) {
  const local = useLocalPremiumValue();
  const value = useMemo<PremiumContextValue>(
    () => ({
      isPremium: local.isPremium,
      activePlan: local.activePlan,
      loading: !local.hasHydrated,
      error: null,
      syncEntitlements: local.syncEntitlements,
      resetPremium: local.resetPremium,
      reload: async () => {
        await usePremiumStore.persist.rehydrate();
      },
    }),
    [local],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

function RemotePremiumProvider({ children }: { children: ReactNode }) {
  const local = useLocalPremiumValue();
  const { syncEntitlements } = local;
  // `cache: true` replays the last known entitlements on cold start, so premium
  // state is correct before (and without) a network round trip.
  const entitlements = useOnbornEntitlements({ autoLoad: true, cache: true });

  useEffect(() => {
    if (!entitlements.data) {
      return;
    }
    const hasPremium = hasPremiumEntitlement(entitlements.data.entitlements);
    // The cached snapshot may restore/keep premium instantly on cold start, but
    // it must never REMOVE it: only a fresh server response is allowed to
    // downgrade premium (a real expiry or refund). Without this, an empty
    // cached read — or a pre-purchase fetch resolving after a purchase — would
    // flip a paid user back to locked.
    if (!hasPremium && entitlements.stale) {
      return;
    }
    syncEntitlements(entitlements.data.entitlements);
  }, [entitlements.data, entitlements.stale, syncEntitlements]);

  // Authoritative refetch. The paywall calls this after a purchase so the query
  // catches up to the just-granted entitlement; the SDK's request-sequence
  // guard makes it supersede the pre-purchase fetch fired at mount. The data
  // effect above mirrors the result, so we intentionally do not sync here.
  const reload = useCallback(async () => {
    await entitlements.reload().catch(() => undefined);
  }, [entitlements]);

  const value = useMemo<PremiumContextValue>(
    () => ({
      isPremium: local.isPremium,
      activePlan: local.activePlan,
      loading: !local.hasHydrated || entitlements.loading,
      error: entitlements.error,
      syncEntitlements: local.syncEntitlements,
      resetPremium: local.resetPremium,
      reload,
    }),
    [entitlements.error, entitlements.loading, local, reload],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used inside PremiumProvider.');
  }
  return context;
}
