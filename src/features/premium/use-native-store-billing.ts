import { isEligibleForIntroOfferIOS } from 'expo-iap';
import { useExpoIapBillingAdapter } from '@onborn/billing/expo-iap'
import { useCallback, useEffect, useState } from 'react';

import { RO_REWARD_PRODUCT_ID, SUBSCRIPTION_PLANS } from '@/config/app';

const STORE_PRODUCT_IDS = [
  ...SUBSCRIPTION_PLANS.map((plan) => plan.productId),
  RO_REWARD_PRODUCT_ID,
];

export type RoRewardOffer = {
  loading: boolean;
  available: boolean;
  eligible: boolean;
  productId: string;
  standardPrice: string | null;
  introductoryPrice: string | null;
};

const EMPTY_REWARD_OFFER: RoRewardOffer = {
  loading: true,
  available: false,
  eligible: false,
  productId: RO_REWARD_PRODUCT_ID,
  standardPrice: null,
  introductoryPrice: null,
};

function readRoRewardOffer(product: unknown) {
  if (!product || typeof product !== 'object') return null;
  const candidate = product as {
    id?: unknown;
    displayPrice?: unknown;
    subscriptionGroupIdIOS?: unknown;
    subscriptionOffers?: unknown;
  };
  if (candidate.id !== RO_REWARD_PRODUCT_ID) return null;

  const offers = Array.isArray(candidate.subscriptionOffers) ? candidate.subscriptionOffers : [];
  const introductory = offers.find((offer) => {
    if (!offer || typeof offer !== 'object') return false;
    return 'type' in offer && offer.type === 'introductory';
  }) as { displayPrice?: unknown } | undefined;

  return {
    groupId:
      typeof candidate.subscriptionGroupIdIOS === 'string'
        ? candidate.subscriptionGroupIdIOS
        : null,
    standardPrice: typeof candidate.displayPrice === 'string' ? candidate.displayPrice : null,
    introductoryPrice:
      typeof introductory?.displayPrice === 'string' ? introductory.displayPrice : null,
  };
}

export function useNativeStoreBilling() {
  const nativeBilling = useExpoIapBillingAdapter({ productIds: STORE_PRODUCT_IDS });
  const { connected, reloadProducts } = nativeBilling;
  const [roRewardOffer, setRoRewardOffer] = useState<RoRewardOffer>(EMPTY_REWARD_OFFER);

  const reloadRoRewardOffer = useCallback(async () => {
    if (!connected) {
      setRoRewardOffer((current) => ({ ...current, loading: true }));
      return;
    }

    setRoRewardOffer((current) => ({ ...current, loading: true }));
    try {
      const products = await reloadProducts([RO_REWARD_PRODUCT_ID]);
      const offer = readRoRewardOffer(
        products.find((product) => product.id === RO_REWARD_PRODUCT_ID),
      );
      if (!offer?.groupId || !offer.introductoryPrice) {
        setRoRewardOffer({
          ...EMPTY_REWARD_OFFER,
          loading: false,
          standardPrice: offer?.standardPrice ?? null,
        });
        return;
      }

      const eligible = await isEligibleForIntroOfferIOS(offer.groupId);
      setRoRewardOffer({
        loading: false,
        available: true,
        eligible,
        productId: RO_REWARD_PRODUCT_ID,
        standardPrice: offer.standardPrice,
        introductoryPrice: offer.introductoryPrice,
      });
    } catch {
      setRoRewardOffer({ ...EMPTY_REWARD_OFFER, loading: false });
    }
  }, [connected, reloadProducts]);

  useEffect(() => {
    const id = setTimeout(() => void reloadRoRewardOffer(), 0);
    return () => clearTimeout(id);
  }, [reloadRoRewardOffer]);

  return {
    ...nativeBilling,
    roRewardOffer,
    reloadRoRewardOffer,
  };
}

export type NativeStoreBilling = ReturnType<typeof useNativeStoreBilling>;
