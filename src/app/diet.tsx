import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { HealthSafetyNotice } from '@/components/health-safety-notice';
import { ModuleCard } from '@/components/module-card';
import { ScreenBackground } from '@/components/screen-background';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { AVOID_KEYS, EAT_KEYS, MEAL_PLAN_IDS } from '@/features/content/diet';
import { isDietDayPremium } from '@/features/premium/access';
import { usePremium } from '@/hooks/use-premium';
import { useTheme, useThemeName } from '@/hooks/use-theme';

export default function DietScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const themeName = useThemeName();
  const { isPremium, loading } = usePremium();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedId = MEAL_PLAN_IDS[selectedIndex];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <BackButton label={t('common.back')} onPress={() => router.back()} />

          <ModuleCard module="diet" title={t('diet.title')} subtitle={t('diet.subtitle')} meta={t('diet.planMeta')} />

          <HealthSafetyNotice text={t('diet.disclaimer')} module="diet" />

          <SectionHeader title={t('diet.mealPlan')} meta={t('diet.mealPlanMeta')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelector}>
            {MEAL_PLAN_IDS.map((id, index) => {
              const active = selectedIndex === index;
              const locked = !loading && !isPremium && isDietDayPremium(index);
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={locked ? `${t('common.day', { count: index + 1 })}. ${t('common.premium')}` : undefined}
                  onPress={() => {
                    if (locked) {
                      router.push('/paywall');
                      return;
                    }
                    setSelectedIndex(index);
                  }}
                  style={[
                    styles.dayPill,
                    locked && styles.lockedDayPill,
                    {
                      backgroundColor: active ? theme.gold : theme.surface,
                      borderColor: active ? theme.gold : theme.border,
                    },
                  ]}>
                  <ThemedText style={[Type.caption, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                    {t('common.day', { count: index + 1 })}
                  </ThemedText>
                  {locked ? (
                    <View style={styles.dayLock}>
                      <SymbolView name="lock.fill" size={11} tintColor={theme.gold} />
                    </View>
                  ) : null}
                  <ThemedText
                    numberOfLines={1}
                    style={[Type.caption, styles.dayPillTitle, { color: active ? '#FFFFFF' : theme.textPrimary }]}>
                    {t(`diet.days.${id}.title`)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.planCard,
              { backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface },
              themeName === 'light' && styles.lightShadow,
            ]}>
            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: `${theme.gold}22` }]}>
                <Icon name="fork.knife" color={theme.gold} />
              </View>
              <View style={styles.planTitle}>
                <ThemedText style={[Type.caption, { color: theme.gold }]}>
                  {t('common.day', { count: selectedIndex + 1 })}
                </ThemedText>
                <ThemedText style={Type.h2}>{t(`diet.days.${selectedId}.title`)}</ThemedText>
              </View>
            </View>
            {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
              <View key={slot} style={[styles.mealRow, { borderColor: theme.border }]}>
                <View style={[styles.mealIcon, { backgroundColor: theme.surfaceHigh }]}>
                  <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                    {slot === 'breakfast' ? 'AM' : slot === 'lunch' ? 'NO' : 'PM'}
                  </ThemedText>
                </View>
                <View style={styles.mealText}>
                  <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                    {t(`diet.meals.${slot}`)}
                  </ThemedText>
                  <ThemedText style={Type.body}>{t(`diet.days.${selectedId}.${slot}`)}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          <SectionHeader title={t('diet.principles')} meta={t('diet.principlesMeta')} />
          <View style={styles.columns}>
            <PrincipleList title={t('diet.eatTitle')} keysList={EAT_KEYS} color={theme.aurora} mode="eat" />
            <PrincipleList title={t('diet.avoidTitle')} keysList={AVOID_KEYS} color={theme.blood} mode="avoid" />
          </View>

          <HealthSafetyNotice text={t('diet.allergyDisclaimer')} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Icon({ name, color }: { name: SFSymbol; color: string }) {
  if (Platform.OS !== 'ios') {
    return <ThemedText style={[Type.h2, { color }]}>+</ThemedText>;
  }
  return <SymbolView name={name} size={20} tintColor={color} />;
}

function PrincipleList({
  title,
  keysList,
  color,
  mode,
}: {
  title: string;
  keysList: readonly string[];
  color: string;
  mode: 'eat' | 'avoid';
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={[styles.listCard, { backgroundColor: theme.surface }]}>
      <View style={styles.listHeader}>
        <View style={[styles.listDot, { backgroundColor: `${color}22` }]}>
          <ThemedText style={[Type.caption, { color }]}>{mode === 'eat' ? '✓' : '×'}</ThemedText>
        </View>
        <ThemedText style={Type.h2}>{title}</ThemedText>
      </View>
      {keysList.map((key) => (
        <View key={key} style={styles.principleRow}>
          <View style={[styles.principleBullet, { backgroundColor: color }]} />
          <ThemedText style={[Type.body, styles.principleText]}>{t(key)}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  columns: {
    gap: Spacing.two,
  },
  listCard: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  listDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  principleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  principleText: {
    flex: 1,
  },
  daySelector: {
    gap: Spacing.two,
    paddingRight: ScreenPadding,
  },
  dayPill: {
    width: 116,
    minHeight: 66,
    borderRadius: Radius.control,
    borderWidth: 1,
    padding: Spacing.two,
    justifyContent: 'center',
    gap: 2,
  },
  dayPillTitle: {
    fontSize: 12,
  },
  lockedDayPill: {
    opacity: 0.58,
  },
  dayLock: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    flex: 1,
    gap: 2,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  mealIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealText: {
    flex: 1,
    gap: 2,
  },
  lightShadow: {
    boxShadow: '0 2px 8px rgba(14, 26, 43, 0.05)',
  },
});
