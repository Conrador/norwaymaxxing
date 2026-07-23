import {
  useOnbornOffering,
  type OnbornBillingAdapter,
} from '@onborn/billing';
import { useExpoIapBillingAdapter } from '@onborn/billing/expo-iap';
import { useMemo } from 'react';

import { RO_REWARD_PRODUCT_ID } from '@/config/app';

export type RoRewardOffer = {
  loading: boolean;
  available: boolean;
  introductoryPrice: string | null;
  standardPrice: string | null;
};

/**
 * Native store billing for the paywall.
 *
 * Intro-offer pricing and eligibility used to be resolved here by hand (reading
 * StoreKit's `subscriptionOffers` and calling `isEligibleForIntroOfferIOS`).
 * The Onborn SDK now does both and exposes the result as `product.introOffer`.
 */
export function useNativeStoreBilling() {
  return useExpoIapBillingAdapter({
    productRetryCount: 3,
    productRetryDelayMs: 800,
  });
}

/**
 * The Viking Row reward offer, needed before the paywall renders so the flow
 * can decide whether to run the reward game at all.
 *
 * The SDK only returns an `introOffer` the customer can actually redeem, so its
 * presence *is* the eligibility answer — no separate check.
 */
export function useRoRewardOffer(
  billingAdapter: OnbornBillingAdapter | undefined,
): RoRewardOffer {
  const { packages, loading } = useOnbornOffering({ billingAdapter });

  return useMemo(() => {
    const item = packages.find(
      (entry) => entry.product?.storeProductId === RO_REWARD_PRODUCT_ID,
    );
    const offer = item?.product?.introOffer;
    return {
      loading,
      available: Boolean(offer?.price),
      introductoryPrice: offer?.price ?? null,
      standardPrice: item?.product?.price ?? null,
    };
  }, [loading, packages]);
}

export type NativeStoreBilling = ReturnType<typeof useNativeStoreBilling>;
