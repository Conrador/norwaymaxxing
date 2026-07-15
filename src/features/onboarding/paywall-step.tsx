import { useOnbornOffering, type OnbornPackageWithProduct } from '@onborn/billing';
import { getLocales } from 'expo-localization';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import {
  DEFAULT_PLAN_ID,
  RO_REWARD_PRODUCT_ID,
  SUBSCRIPTION_PLANS,
  type PlanId,
} from '@/config/app';
import { PRIVACY_POLICY_URL, TERMS_URL } from '@/config/legal';
import { Fonts, Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import {
  type NativeStoreBilling,
  useNativeStoreBilling,
} from '@/features/premium/use-native-store-billing';
import { usePremium } from '@/hooks/use-premium';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import {
  createStandalonePaywallAnalyticsContext,
  flushOnbornAnalytics,
  trackPaywallConverted,
  trackPaywallDismissed,
  trackPaywallPackageSelected,
  trackPaywallPurchaseFailed,
  trackPaywallPurchaseStarted,
  trackPaywallViewed,
  type PaywallAnalyticsContext,
} from '@/lib/onborn-analytics';

const BENEFIT_KEYS = [
  'paywall.benefit.cold',
  'paywall.benefit.sauna',
  'paywall.benefit.nature',
  'paywall.benefit.diet',
  'paywall.benefit.stats',
];

const STORE_CONNECTION_TIMEOUT_MS = 10_000;

type RuntimePlan = {
  id: PlanId;
  packageId: string;
  productId: string;
  price: string;
  perWeek?: string;
  originalPrice?: string;
  reward: boolean;
};

type PackageKind = PlanId | 'yearlyReward';

function resolvePackageKind(item: OnbornPackageWithProduct): PackageKind | null {
  const storeProductId = item.product?.storeProductId;
  if (storeProductId === RO_REWARD_PRODUCT_ID) return 'yearlyReward';
  const exact = SUBSCRIPTION_PLANS.find((plan) => plan.productId === storeProductId);
  if (exact) return exact.id;

  const descriptor = [
    item.package.id,
    item.package.label,
    item.package.description,
    storeProductId,
    item.product?.period,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/reward|ro20|ro.reward/.test(descriptor)) return 'yearlyReward';
  if (/year|annual|12.month|p1y/.test(descriptor)) return 'yearly';
  if (/month|p1m/.test(descriptor)) return 'monthly';
  return null;
}

function nativeWeeklyPrice(item: OnbornPackageWithProduct, locale: string) {
  const nativeProduct = item.product?.metadata?.nativeStoreProduct;
  if (!nativeProduct || typeof nativeProduct !== 'object') return undefined;

  const price = 'price' in nativeProduct ? nativeProduct.price : undefined;
  const currency = 'currency' in nativeProduct ? nativeProduct.currency : undefined;
  if (typeof price !== 'number' || typeof currency !== 'string') return undefined;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price / 52);
  } catch {
    return undefined;
  }
}

function isCancelled(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; message?: unknown; userCancelled?: unknown };
  return candidate.userCancelled === true ||
    (typeof candidate.code === 'string' && candidate.code.toLowerCase().includes('cancel')) ||
    (typeof candidate.message === 'string' && candidate.message.toLowerCase().includes('cancel'));
}

type PaywallStepProps = {
  onSubscribe: (plan: PlanId) => void;
  onDismiss: () => void;
  analyticsContext?: PaywallAnalyticsContext;
  roRewardUnlocked?: boolean;
};

export function ConnectedPaywallStep(props: PaywallStepProps) {
  const storeBilling = useNativeStoreBilling();
  return <PaywallStep {...props} storeBilling={storeBilling} />;
}

export function PaywallStep({
  onSubscribe,
  onDismiss,
  storeBilling,
  roRewardUnlocked = false,
  analyticsContext: providedAnalyticsContext,
}: PaywallStepProps & { storeBilling: NativeStoreBilling }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const { syncEntitlements } = usePremium();
  const {
    billingAdapter,
    connected,
    finishValidatedPurchase,
    reloadRoRewardOffer,
    roRewardOffer,
  } = storeBilling;
  const [selected, setSelected] = useState<PlanId>(DEFAULT_PLAN_ID);
  const [showClose, setShowClose] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [storeConnectionTimedOut, setStoreConnectionTimedOut] = useState(false);
  const [locale] = useState(() => getLocales()[0]?.languageTag ?? 'en-US');
  const [fallbackAnalyticsContext] = useState(() => createStandalonePaywallAnalyticsContext());
  const [paywallViewedAt] = useState(() => Date.now());
  const exitTracked = useRef(false);
  const analyticsContext = providedAnalyticsContext ?? fallbackAnalyticsContext;
  const billing = useOnbornOffering({ billingAdapter });

  const packagesByKind = useMemo<Partial<Record<PackageKind, RuntimePlan>>>(() => {
    const result: Partial<Record<PackageKind, RuntimePlan>> = {};
    for (const item of billing.packages) {
      const kind = resolvePackageKind(item);
      const productId = item.product?.storeProductId;
      const storePrice = item.product?.price?.trim();
      if (!kind || !productId || !storePrice) continue;

      const reward = kind === 'yearlyReward';
      result[kind] = {
        id: kind === 'monthly' ? 'monthly' : 'yearly',
        packageId: item.package.id,
        productId,
        price: reward ? roRewardOffer.introductoryPrice ?? storePrice : storePrice,
        perWeek: kind === 'yearly' ? nativeWeeklyPrice(item, locale) : undefined,
        originalPrice: reward
          ? roRewardOffer.standardPrice ?? storePrice
          : undefined,
        reward,
      };
    }

    return result;
  }, [billing.packages, locale, roRewardOffer.introductoryPrice, roRewardOffer.standardPrice]);

  const rewardApplied =
    roRewardUnlocked &&
    roRewardOffer.available &&
    roRewardOffer.eligible &&
    Boolean(packagesByKind.yearlyReward);
  const plans = useMemo<Partial<Record<PlanId, RuntimePlan>>>(
    () => ({
      yearly: rewardApplied ? packagesByKind.yearlyReward : packagesByKind.yearly,
      monthly: packagesByKind.monthly,
    }),
    [packagesByKind, rewardApplied],
  );
  const availablePlans = useMemo(
    () => SUBSCRIPTION_PLANS.filter((plan) => Boolean(plans[plan.id])),
    [plans],
  );
  const activePlanId = plans[selected] ? selected : availablePlans[0]?.id ?? selected;
  const waitingForStore = !connected && !storeConnectionTimedOut;
  const storeUnavailable = !connected && storeConnectionTimedOut;
  const pricingLoading =
    waitingForStore ||
    (connected &&
      (!billingAdapter || billing.loading || (roRewardUnlocked && roRewardOffer.loading)));
  const pricingUnavailable =
    storeUnavailable ||
    (!pricingLoading && (Boolean(billing.error) || availablePlans.length === 0));

  useEffect(() => {
    const id = setTimeout(() => setShowClose(true), 1500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (connected) return;
    const id = setTimeout(() => setStoreConnectionTimedOut(true), STORE_CONNECTION_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [connected, connectionAttempt]);

  useEffect(() => {
    if (__DEV__ && billing.error) {
      console.warn('Unable to load Onborn offering or App Store prices.', billing.error);
    }
  }, [billing.error]);

  useEffect(() => {
    trackPaywallViewed(analyticsContext);
    return () => {
      if (!exitTracked.current) {
        trackPaywallDismissed(analyticsContext, Date.now() - paywallViewedAt);
      }
      void flushOnbornAnalytics();
    };
  }, [analyticsContext, paywallViewedAt]);

  const subscribe = async () => {
    const plan = plans[activePlanId];
    if (!plan) {
      setBillingMessage(t('paywall.unavailable'));
      return;
    }

    setBillingMessage(null);
    trackPaywallPurchaseStarted(analyticsContext, plan.packageId, plan.productId);
    try {
      const result = await billing.purchasePackage(plan.packageId);
      if (result.status !== 'validated' || !result.entitlements) {
        trackPaywallPurchaseFailed(
          analyticsContext,
          plan.packageId,
          plan.productId,
          'pending',
        );
        setBillingMessage(t('paywall.pending'));
        return;
      }

      await finishValidatedPurchase(result).catch((error) => {
        if (__DEV__) console.warn('Unable to finish validated StoreKit transaction.', error);
      });

      if (!syncEntitlements(result.entitlements, activePlanId)) {
        trackPaywallPurchaseFailed(
          analyticsContext,
          plan.packageId,
          plan.productId,
          'error',
        );
        setBillingMessage(t('paywall.entitlementMissing'));
        return;
      }

      exitTracked.current = true;
      trackPaywallConverted(analyticsContext, plan.productId);
      onSubscribe(activePlanId);
    } catch (error) {
      const cancelled = isCancelled(error);
      trackPaywallPurchaseFailed(
        analyticsContext,
        plan.packageId,
        plan.productId,
        cancelled ? 'cancelled' : 'error',
      );
      if (!cancelled) setBillingMessage(t('paywall.purchaseFailed'));
    }
  };

  const restore = async () => {
    setBillingMessage(null);
    try {
      const result = await billing.restorePurchases();
      const restored = syncEntitlements(result.entitlements ?? []);
      if (!restored) {
        Alert.alert(t('paywall.restoreTitle'), t('paywall.nothingToRestore'));
        return;
      }

      Alert.alert(t('paywall.restoreTitle'), t('paywall.restoreSuccess'));
      exitTracked.current = true;
      onSubscribe(activePlanId);
    } catch {
      setBillingMessage(t('paywall.restoreFailed'));
    }
  };

  const busy = billing.purchasing || billing.restoring;
  const canPurchase = connected && Boolean(plans[activePlanId]) && !pricingLoading && !busy;
  const retryPricing = () => {
    setBillingMessage(null);
    setStoreConnectionTimedOut(false);
    setConnectionAttempt((attempt) => attempt + 1);
    void Promise.all([billing.reload(), reloadRoRewardOffer()]);
  };
  const heroGradient =
    themeName === 'dark'
      ? (['#16283F', '#12233A', theme.bg] as const)
      : (['#DCE9F7', '#EAF2FB', theme.bg] as const);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.six }]}>
        <LinearGradient colors={heroGradient} style={[styles.hero, { paddingTop: insets.top + Spacing.four }]}>
          <View style={styles.proofRow}>
            <SymbolView name="checkmark.seal.fill" size={17} tintColor={theme.aurora} />
            <ThemedText style={[Type.caption, styles.proofText, { color: theme.textSecondary }]}>
              {t('paywall.social')}
            </ThemedText>
          </View>
          <ThemedText style={styles.heroTitle}>
            {t('paywall.titleA')}
            <ThemedText style={[styles.heroAccent, { color: theme.frost }]}>{t('paywall.titleB')}</ThemedText>
            {t('paywall.titleC')}
          </ThemedText>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.benefits}>
            {BENEFIT_KEYS.map((key) => (
              <View key={key} style={styles.benefitRow}>
                <ThemedText style={[styles.check, { color: theme.aurora }]}>✓</ThemedText>
                <ThemedText style={[Type.body, styles.benefitText]}>{t(key)}</ThemedText>
              </View>
            ))}
          </View>

          {pricingLoading ? (
            <View style={styles.pricingLoading} accessibilityLiveRegion="polite">
              <ActivityIndicator color={theme.frost} />
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                {t('paywall.loadingPrices')}
              </ThemedText>
            </View>
          ) : pricingUnavailable ? (
            <View style={styles.billingStatus}>
              <ThemedText style={[Type.caption, { color: theme.blood, textAlign: 'center' }]}>
                {t('paywall.unavailable')}
              </ThemedText>
              <Pressable onPress={retryPricing} hitSlop={10}>
                <ThemedText style={[Type.caption, { color: theme.frost }]}>{t('paywall.retry')}</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.plans}>
              {availablePlans.map((plan) => {
                const active = activePlanId === plan.id;
                const runtimePlan = plans[plan.id]!;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelected(plan.id);
                      billing.selectPackage(runtimePlan.packageId);
                      trackPaywallPackageSelected(
                        analyticsContext,
                        runtimePlan.packageId,
                        runtimePlan.productId,
                      );
                    }}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface,
                        borderColor: active ? theme.frost : theme.border,
                        borderWidth: active ? 2 : 1,
                      },
                    ]}>
                    {(plan.highlighted || runtimePlan.reward) && (
                      <View style={[styles.badge, { backgroundColor: theme.gold }]}>
                        <Text style={styles.badgeText}>
                          {t(runtimePlan.reward ? 'paywall.rewardBadge' : 'paywall.bestValue')}
                        </Text>
                      </View>
                    )}
                    <View style={styles.planLeft}>
                      <ThemedText style={Type.h2}>{t(plan.titleKey)}</ThemedText>
                      {runtimePlan.reward ? (
                        <ThemedText style={[Type.caption, { color: theme.gold }]}>
                          {t('paywall.rewardFirstYear')}
                        </ThemedText>
                      ) : runtimePlan.perWeek ? (
                        <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                          {t('paywall.perWeek', { price: runtimePlan.perWeek })}
                        </ThemedText>
                      ) : null}
                    </View>
                    <View style={styles.planRight}>
                      <View style={styles.priceLine}>
                        {runtimePlan.reward && runtimePlan.originalPrice && (
                          <ThemedText style={[Type.caption, styles.originalPrice, { color: theme.textSecondary }]}>
                            {runtimePlan.originalPrice}
                          </ThemedText>
                        )}
                        <ThemedText style={[Type.h2, { color: active ? theme.frost : theme.textPrimary }]}>
                          {runtimePlan.price}
                        </ThemedText>
                      </View>
                      <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                        {t(plan.id === 'yearly' ? 'paywall.perYear' : 'paywall.perMonth')}
                      </ThemedText>
                      {runtimePlan.reward && runtimePlan.originalPrice && (
                        <ThemedText style={[styles.renewalText, { color: theme.textSecondary }]}>
                          {t('paywall.rewardRenews', { price: runtimePlan.originalPrice })}
                        </ThemedText>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {billingMessage ? (
            <View style={styles.billingStatus}>
              <ThemedText style={[Type.caption, { color: theme.blood, textAlign: 'center' }]}>
                {billingMessage}
              </ThemedText>
            </View>
          ) : null}

          {!pricingLoading && !pricingUnavailable ? (
            <>
              <UiButton
                label={billing.purchasing ? t('paywall.processing') : t('paywall.cta')}
                variant="prominent"
                tintColor={theme.frost}
                fullWidth
                disabled={!canPurchase}
                onPress={() => void subscribe()}
              />
              <ThemedText style={[Type.caption, styles.cancel, { color: theme.textSecondary }]}>
                {t('paywall.cancelAnytime')}
              </ThemedText>
            </>
          ) : null}

          <View style={styles.footer}>
            <Pressable disabled={busy || !connected} onPress={() => void restore()} hitSlop={8}>
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                {billing.restoring ? t('paywall.restoring') : t('paywall.restore')}
              </ThemedText>
            </Pressable>
            <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>·</ThemedText>
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(TERMS_URL)}
              hitSlop={8}>
              <ThemedText style={[Type.caption, styles.legalLink, { color: theme.textSecondary }]}>
                {t('paywall.terms')}
              </ThemedText>
            </Pressable>
            <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>·</ThemedText>
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
              hitSlop={8}>
              <ThemedText style={[Type.caption, styles.legalLink, { color: theme.textSecondary }]}>
                {t('paywall.privacy')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {showClose && (
        <Animated.View entering={FadeIn.duration(400)} style={[styles.closeWrap, { top: insets.top + Spacing.one }]}>
          <Pressable
            onPress={() => {
              exitTracked.current = true;
              trackPaywallDismissed(analyticsContext, Date.now() - paywallViewedAt);
              onDismiss();
            }}
            hitSlop={14}
            style={styles.close}>
            <ThemedText style={{ color: theme.textSecondary, fontSize: 22 }}>✕</ThemedText>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {},
  hero: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: Spacing.five,
    minHeight: 260,
    justifyContent: 'flex-end',
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  proofText: { flex: 1 },
  heroTitle: { fontFamily: Type.display.fontFamily, fontSize: 32, lineHeight: 38 },
  heroAccent: {
    fontFamily: Fonts.accent,
    fontStyle: 'italic',
    fontSize: 46,
    lineHeight: 50,
  },
  content: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  benefits: { gap: Spacing.two + Spacing.one },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  check: { fontSize: 18, fontWeight: '700' },
  benefitText: { flex: 1 },
  plans: { gap: Spacing.two + Spacing.one },
  pricingLoading: {
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  planCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  badge: {
    position: 'absolute',
    top: -10,
    left: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: '#1A1200' },
  planLeft: { gap: 2 },
  planRight: { maxWidth: '56%', alignItems: 'flex-end', gap: 2 },
  priceLine: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  originalPrice: { textDecorationLine: 'line-through' },
  renewalText: { ...Type.caption, fontSize: 11, lineHeight: 14, textAlign: 'right' },
  billingStatus: { alignItems: 'center', gap: Spacing.one },
  cancel: { textAlign: 'center' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.one },
  legalLink: { textDecorationLine: 'underline' },
  closeWrap: { position: 'absolute', top: 0, right: ScreenPadding },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
});
