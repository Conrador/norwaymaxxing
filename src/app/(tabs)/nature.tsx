import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearProgress } from '@/components/linear-progress';
import { ModuleCard } from '@/components/module-card';
import { ScreenBackground } from '@/components/screen-background';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, CardGap, Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { dailyNatureChallenges, NATURE_CHALLENGES, type ChallengeCategory } from '@/features/content/challenges';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { dateKey } from '@/lib/dates';
import { useProgress } from '@/stores/progress';

type Filter = 'all' | ChallengeCategory;
const FILTERS: Filter[] = ['all', 'forest', 'water', 'fire', 'winter'];
const EMPTY_IDS: string[] = [];

export default function NatureScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const themeName = useThemeName();
  const [filter, setFilter] = useState<Filter>('all');
  const todayKey = dateKey();
  const dailySet = dailyNatureChallenges();
  const dailyIds = dailySet.map((challenge) => challenge.id);
  const dailyDone = useProgress((s) => s.natureDailyDone?.[todayKey] ?? EMPTY_IDS);
  const totalMinutes = useProgress((s) => s.history[todayKey]?.natureMinutes ?? 0);
  const seen = useProgress((s) => s.challengesDone);
  const completed = dailySet.filter((challenge) => dailyDone.includes(challenge.id)).length;
  const filteredChallenges =
    filter === 'all' ? NATURE_CHALLENGES : NATURE_CHALLENGES.filter((challenge) => challenge.category === filter);
  const progress = completed / dailySet.length;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={
              themeName === 'dark'
                ? ['#16452E', '#10301F', '#0D2016']
                : ['#CBEFAF', '#DDF6C7', '#EDFADF']
            }
            style={styles.hero}>
            <View style={styles.heroGlyph}>
              {Platform.OS === 'ios' ? (
                <SymbolView
                  name="leaf.fill"
                  size={150}
                  tintColor={theme.aurora}
                  style={styles.heroGlyphOpacity}
                />
              ) : (
                <ThemedText style={styles.heroGlyphEmoji}>🌿</ThemedText>
              )}
            </View>

            <View style={styles.heroText}>
              <ThemedText style={Type.display}>{t('nature.title')}</ThemedText>
              <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
                {t('nature.subtitle')}
              </ThemedText>
            </View>

            <View style={styles.heroMeter}>
              <View style={styles.heroMeterLabels}>
                <ThemedText style={[Type.caption, styles.heroMeterKicker, { color: theme.textSecondary }]}>
                  {t('nature.todaySet').toUpperCase()}
                </ThemedText>
                <ThemedText style={[Type.caption, { color: theme.aurora }]}>
                  {completed}/{dailySet.length}
                </ThemedText>
              </View>
              <LinearProgress value={progress} color={theme.aurora} />
              {totalMinutes > 0 && (
                <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                  {t('nature.minutesToday', { count: totalMinutes })}
                </ThemedText>
              )}
            </View>
          </LinearGradient>

          <SectionHeader title={t('nature.todaySet')} meta={t('nature.todaySetMeta')} />
          <View style={styles.todayStack}>
            {dailySet.map((challenge) => {
              const isDone = dailyDone.includes(challenge.id);
              return (
                <ModuleCard
                  key={challenge.id}
                  module={challenge.module}
                  title={t(challenge.titleKey)}
                  subtitle={t(challenge.subtitleKey)}
                  meta={isDone ? t('common.done') : t('common.xp', { count: challenge.xp })}
                  progress={isDone ? 1 : 0}
                  onPress={() => router.push(`/challenge/${challenge.id}` as never)}
                />
              );
            })}
          </View>

          <SectionHeader title={t('nature.library')} meta={t('nature.libraryMeta')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.map((item) => {
              const active = filter === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: active ? theme.aurora : theme.surface,
                      borderColor: active ? theme.aurora : theme.border,
                    },
                  ]}>
                  <ThemedText style={[Type.caption, { color: active ? '#FFFFFF' : theme.textPrimary }]}>
                    {t(`nature.filters.${item}`)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.grid}>
            {filteredChallenges.map((challenge) => {
              const inTodaySet = dailyIds.includes(challenge.id);
              const isDoneToday = dailyDone.includes(challenge.id);
              const isSeen = seen.includes(challenge.id);
              return (
                <ModuleCard
                  key={challenge.id}
                  compact
                  module={challenge.module}
                  title={t(challenge.titleKey)}
                  subtitle={t(challenge.subtitleKey)}
                  meta={
                    isDoneToday
                      ? t('common.done')
                      : inTodaySet
                        ? t('nature.today')
                        : isSeen
                          ? t('nature.seen')
                          : t('nature.libraryOnly')
                  }
                  progress={isDoneToday ? 1 : 0}
                  onPress={() =>
                    router.push(`/challenge/${challenge.id}` as never)
                  }
                />
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.four,
    overflow: 'hidden',
  },
  heroGlyph: {
    position: 'absolute',
    right: -20,
    top: -14,
  },
  heroGlyphOpacity: {
    opacity: 0.16,
  },
  heroGlyphEmoji: {
    fontSize: 110,
    opacity: 0.14,
  },
  heroText: {
    gap: Spacing.one,
    paddingRight: Spacing.six,
  },
  heroMeter: {
    gap: Spacing.two,
  },
  heroMeterLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  heroMeterKicker: {
    letterSpacing: 1.5,
  },
  filters: {
    gap: Spacing.two,
    paddingRight: ScreenPadding,
  },
  filter: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  todayStack: {
    gap: CardGap,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CardGap,
  },
});
