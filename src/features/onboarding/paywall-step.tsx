import { getLocales } from 'expo-localization';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import {
  DEFAULT_PLAN_ID,
  planPricesForRegion,
  SUBSCRIPTION_PLANS,
  type PlanId,
} from '@/config/app';
import { Fonts, Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import {
  createStandalonePaywallAnalyticsContext,
  flushOnbornAnalytics,
  trackPaywallDismissed,
  trackPaywallPackageSelected,
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

/**
 * Paywall (onboarding_paywall.md §7): hero → social proof → benefity →
 * 2 plany (yearly domyślny) → CTA „Odblokuj". BEZ trialu. Miękki: X pozwala
 * wejść jako free. Zakup na razie stub (płatności przez onborn później).
 */
export function PaywallStep({
  onSubscribe,
  onDismiss,
  analyticsContext: providedAnalyticsContext,
}: {
  onSubscribe: (plan: PlanId) => void;
  onDismiss: () => void;
  analyticsContext?: PaywallAnalyticsContext;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PlanId>(DEFAULT_PLAN_ID);
  const [showClose, setShowClose] = useState(false);
  const [country] = useState(() => getLocales()[0]?.regionCode ?? null);
  const [fallbackAnalyticsContext] = useState(() => createStandalonePaywallAnalyticsContext());
  const [paywallViewedAt] = useState(() => Date.now());
  const exitTracked = useRef(false);
  const analyticsContext = providedAnalyticsContext ?? fallbackAnalyticsContext;
  const prices = useMemo(() => planPricesForRegion(country), [country]);

  useEffect(() => {
    const id = setTimeout(() => setShowClose(true), 1500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    trackPaywallViewed(analyticsContext);
    return () => {
      if (!exitTracked.current) {
        trackPaywallDismissed(analyticsContext, Date.now() - paywallViewedAt);
      }
      void flushOnbornAnalytics();
    };
  }, [analyticsContext, paywallViewedAt]);

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
          <ThemedText style={[Type.caption, styles.stars, { color: theme.gold }]}>
            ★★★★★  {t('paywall.social')}
          </ThemedText>
          <ThemedText style={styles.heroTitle}>
            {t('paywall.titleA')}
            <ThemedText style={[styles.heroAccent, { color: theme.frost }]}>
              {t('paywall.titleB')}
            </ThemedText>
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

          <View style={styles.plans}>
            {SUBSCRIPTION_PLANS.map((plan) => {
              const active = selected === plan.id;
              const price = prices[plan.id];
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (selected !== plan.id) {
                      trackPaywallPackageSelected(analyticsContext, plan.id, plan.productId);
                    }
                    setSelected(plan.id);
                  }}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface,
                      borderColor: active ? theme.frost : theme.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}>
                  {plan.highlighted && (
                    <View style={[styles.badge, { backgroundColor: theme.gold }]}>
                      <Text style={styles.badgeText}>{t('paywall.bestValue')}</Text>
                    </View>
                  )}
                  <View style={styles.planLeft}>
                    <ThemedText style={[Type.h2]}>{t(plan.titleKey)}</ThemedText>
                    {price.perWeek && (
                      <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                        {t('paywall.perWeek', { price: price.perWeek })}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.planRight}>
                    <ThemedText style={[Type.h2, { color: active ? theme.frost : theme.textPrimary }]}>
                      {price.price}
                    </ThemedText>
                    <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                      {t(plan.id === 'yearly' ? 'paywall.perYear' : 'paywall.perMonth')}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <UiButton
            label={t('paywall.cta')}
            variant="prominent"
            tintColor={theme.frost}
            fullWidth
            onPress={() => {
              exitTracked.current = true;
              const plan = SUBSCRIPTION_PLANS.find((item) => item.id === selected);
              if (plan) {
                trackPaywallPurchaseStarted(analyticsContext, plan.id, plan.productId);
              }
              onSubscribe(selected);
            }}
          />
          <ThemedText style={[Type.caption, styles.cancel, { color: theme.textSecondary }]}>
            {t('paywall.cancelAnytime')}
          </ThemedText>

          <View style={styles.footer}>
            <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>{t('paywall.restore')}</ThemedText>
            <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>·  {t('paywall.terms')}</ThemedText>
            <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>·  {t('paywall.privacy')}</ThemedText>
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
  root: {
    flex: 1,
  },
  scroll: {
  },
  hero: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: Spacing.five,
    minHeight: 260,
    justifyContent: 'flex-end',
  },
  stars: {
    letterSpacing: 1,
    marginBottom: Spacing.two,
  },
  heroTitle: {
    fontFamily: Type.display.fontFamily,
    fontSize: 32,
    lineHeight: 38,
  },
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
  benefits: {
    gap: Spacing.two + Spacing.one,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  check: {
    fontSize: 18,
    fontWeight: '700',
  },
  benefitText: {
    flex: 1,
  },
  plans: {
    gap: Spacing.two + Spacing.one,
  },
  planCard: {
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
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#1A1200',
  },
  planLeft: {
    gap: 2,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cancel: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  closeWrap: {
    position: 'absolute',
    top: 0,
    right: ScreenPadding,
  },
  close: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
});
