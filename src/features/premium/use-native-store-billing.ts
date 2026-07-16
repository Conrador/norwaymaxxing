import {
  createNativeStoresBillingAdapter,
  type OnbornBillingAdapter,
  type OnbornPurchaseResult,
} from '@onborn/billing';
import {
  fetchProducts,
  getAvailablePurchases,
  isEligibleForIntroOfferIOS,
  type Purchase,
  useIAP,
} from 'expo-iap';
import { useCallback, useEffect, useRef, useState } from 'react';

import { RO_REWARD_PRODUCT_ID } from '@/config/app';

type PendingPurchase = {
  productId: string;
  resolve: (purchase: Purchase) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  dispatching: boolean;
  bufferedPurchase?: Purchase;
  bufferedError?: Error;
};

const PURCHASE_TIMEOUT_MS = 2 * 60 * 1000;
const CANCELLED_PURCHASE_RECOVERY_DELAY_MS = 750;

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

function purchaseError(error: { message: string; code?: string }) {
  const normalized = new Error(error.message) as Error & {
    code?: string;
    userCancelled?: boolean;
  };
  normalized.code = error.code;
  normalized.userCancelled = error.code === 'user-cancelled';
  return normalized;
}

function isUserCancelledPurchase(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; userCancelled?: unknown };
  return candidate.userCancelled === true || candidate.code === 'user-cancelled';
}

function isPurchase(value: unknown): value is Purchase {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'productId' in value &&
      'transactionDate' in value,
  );
}

function extractPurchase(value: unknown, productId?: string): Purchase | null {
  const candidates = Array.isArray(value) ? value : [value];
  for (const candidate of candidates) {
    if (isPurchase(candidate) && (!productId || candidate.productId === productId)) {
      return candidate;
    }
    if (candidate && typeof candidate === 'object' && 'raw' in candidate) {
      const nested = extractPurchase(candidate.raw, productId);
      if (nested) return nested;
    }
  }
  return null;
}

async function recoverActivePurchase(productId: string): Promise<Purchase | null> {
  await new Promise((resolve) => setTimeout(resolve, CANCELLED_PURCHASE_RECOVERY_DELAY_MS));
  try {
    const purchases = await getAvailablePurchases();
    return extractPurchase(purchases, productId);
  } catch {
    return null;
  }
}

export function useNativeStoreBilling() {
  const pending = useRef<PendingPurchase | null>(null);
  const [billingAdapter, setBillingAdapter] = useState<OnbornBillingAdapter>();
  const [roRewardOffer, setRoRewardOffer] = useState<RoRewardOffer>(EMPTY_REWARD_OFFER);

  const settlePending = useCallback((callback: (item: PendingPurchase) => void) => {
    const item = pending.current;
    if (!item) return;
    clearTimeout(item.timeout);
    pending.current = null;
    callback(item);
  }, []);

  const {
    connected,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      const item = pending.current;
      if (!item || item.productId !== purchase.productId) return;
      if (item.dispatching) {
        item.bufferedPurchase = purchase;
        return;
      }
      settlePending((current) => current.resolve(purchase));
    },
    onPurchaseError: (error) => {
      const item = pending.current;
      if (!item) return;
      if (error.productId && error.productId !== item.productId) return;

      const normalized = purchaseError(error);
      if (item.dispatching) {
        item.bufferedError = normalized;
        return;
      }
      settlePending((current) => current.reject(normalized));
    },
  });

  useEffect(() => () => {
    settlePending((item) => item.reject(new Error('Purchase interrupted.')));
  }, [settlePending]);

  const reloadRoRewardOffer = useCallback(async () => {
    if (!connected) {
      setRoRewardOffer((current) => ({ ...current, loading: true }));
      return;
    }

    setRoRewardOffer((current) => ({ ...current, loading: true }));
    try {
      const products = await fetchProducts({ skus: [RO_REWARD_PRODUCT_ID], type: 'subs' });
      const offer = readRoRewardOffer(products?.find((product) => product.id === RO_REWARD_PRODUCT_ID));
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
  }, [connected]);

  useEffect(() => {
    const id = setTimeout(() => void reloadRoRewardOffer(), 0);
    return () => clearTimeout(id);
  }, [reloadRoRewardOffer]);

  useEffect(() => {
    setBillingAdapter(createNativeStoresBillingAdapter({
      async loadProducts({ storeProductIds }) {
        if (!connected) return;
        const products = await fetchProducts({ skus: storeProductIds, type: 'subs' });
        return (products ?? []).map((product) => ({
          id: product.id,
          productId: product.id,
          title: product.title,
          description: product.description,
          displayPrice: product.displayPrice,
          currency: product.currency,
          price: product.price ?? undefined,
          subscriptionPeriod:
            'subscriptionPeriodUnitIOS' in product
              ? product.subscriptionPeriodUnitIOS ?? undefined
              : undefined,
          raw: product,
        }));
      },
      async purchaseProduct({ storeProductId }) {
        if (!connected) throw new Error('App Store is not connected.');
        if (pending.current) throw new Error('Another purchase is already in progress.');

        const purchase = await new Promise<Purchase>((resolve, reject) => {
          const timeout = setTimeout(() => {
            settlePending((item) => item.reject(new Error('Purchase timed out.')));
          }, PURCHASE_TIMEOUT_MS);

          pending.current = {
            productId: storeProductId,
            resolve,
            reject,
            timeout,
            dispatching: true,
          };

          void (async () => {
            try {
              const result = await requestPurchase({
                request: { apple: { sku: storeProductId } },
                type: 'subs',
              });
              const item = pending.current;
              if (!item || item.productId !== storeProductId) return;
              item.dispatching = false;

              const successfulPurchase =
                extractPurchase(result, storeProductId) ?? item.bufferedPurchase;
              if (successfulPurchase) {
                settlePending((current) => current.resolve(successfulPurchase));
              } else if (item.bufferedError) {
                const recovered = isUserCancelledPurchase(item.bufferedError)
                  ? await recoverActivePurchase(storeProductId)
                  : null;
                if (recovered && pending.current === item) {
                  settlePending((current) => current.resolve(recovered));
                } else if (pending.current === item) {
                  settlePending((current) => current.reject(item.bufferedError!));
                }
              }
            } catch (error) {
              const item = pending.current;
              if (!item || item.productId !== storeProductId) return;
              item.dispatching = false;

              if (item.bufferedPurchase) {
                settlePending((current) => current.resolve(item.bufferedPurchase!));
                return;
              }
              const recovered = isUserCancelledPurchase(error)
                ? await recoverActivePurchase(storeProductId)
                : null;
              if (recovered && pending.current === item) {
                settlePending((current) => current.resolve(recovered));
                return;
              }
              if (pending.current !== item) return;
              settlePending((current) =>
                current.reject(
                  error instanceof Error ? error : new Error('Unable to start purchase.'),
                ),
              );
            }
          })();
        });

        return {
          productId: purchase.productId,
          transactionId: purchase.transactionId ?? undefined,
          purchaseToken: purchase.purchaseToken ?? undefined,
          originalTransactionIdentifierIOS:
            'originalTransactionIdentifierIOS' in purchase
              ? purchase.originalTransactionIdentifierIOS ?? undefined
              : undefined,
          raw: purchase,
        };
      },
      async restorePurchases() {
        if (!connected) throw new Error('App Store is not connected.');
        const purchases = await getAvailablePurchases();
        return purchases.map((purchase) => ({
          store: 'app_store' as const,
          storeProductId: purchase.productId,
          transactionId: purchase.transactionId ?? undefined,
          purchaseToken: purchase.purchaseToken ?? undefined,
          raw: purchase,
        }));
      },
    }));
  }, [connected, requestPurchase, settlePending]);

  const finishValidatedPurchase = useCallback(async (result: OnbornPurchaseResult) => {
    const purchase = extractPurchase(result.raw);
    if (result.status !== 'validated' || !purchase) return;
    await finishTransaction({ purchase, isConsumable: false });
  }, [finishTransaction]);

  return {
    billingAdapter,
    connected,
    finishValidatedPurchase,
    roRewardOffer,
    reloadRoRewardOffer,
  };
}

export type NativeStoreBilling = ReturnType<typeof useNativeStoreBilling>;
