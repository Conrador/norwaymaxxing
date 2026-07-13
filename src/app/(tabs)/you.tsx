import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitMatrix, type HabitMatrixRow } from '@/components/habit-matrix';
import { LinearProgress } from '@/components/linear-progress';
import { ScreenBackground } from '@/components/screen-background';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { moduleColor } from '@/features/protocol/protocol';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { lastNDays } from '@/lib/dates';
import { localeForLanguage } from '@/lib/locale';
import { rankForXp, RANKS, RANK_THRESHOLDS, useProgress } from '@/stores/progress';

function nextRankInfo(xp: number) {
  const rank = rankForXp(xp);
  const index = RANKS.indexOf(rank);
  const isMaxRank = index === RANKS.length - 1;
  const next = RANKS[Math.min(index + 1, RANKS.length - 1)];
  const currentThreshold = RANK_THRESHOLDS[rank];
  const nextThreshold = RANK_THRESHOLDS[next];
  const earnedInRank = Math.max(0, xp - currentThreshold);
  const requiredInRank = Math.max(0, nextThreshold - currentThreshold);
  const progress = isMaxRank ? 1 : earnedInRank / requiredInRank;

  return {
    rank,
    next,
    isMaxRank,
    earnedInRank,
    requiredInRank,
    progress: Math.min(Math.max(progress, 0), 1),
    nextThreshold,
  };
}

/** Czysto typograficzna komórka statystyki (patern Open/Letterboxd) — liczba + uppercase label, zero ikon. */
function StatCell({ value, label, color }: { value: string; label: string; color?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.statCell}>
      <ThemedText style={[styles.statValue, color ? { color } : null]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={2}>
        {label.toUpperCase()}
      </ThemedText>
    </View>
  );
}

export default function YouScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const themeName = useThemeName();
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const history = useProgress((s) => s.history);
  const xpLog = useProgress((s) => s.xpLog);
  const days = lastNDays(7);
  const { rank, next, isMaxRank, earnedInRank, requiredInRank, progress, nextThreshold } =
    nextRankInfo(xp);
  const xpRemaining = Math.max(0, nextThreshold - xp);

  const matrixRows: HabitMatrixRow[] = [
    {
      id: 'cold',
      label: t('practices.cold'),
      color: moduleColor('cold', theme),
      values: days.map((day) => (history[day]?.coldMinutes ?? 0) > 0),
    },
    {
      id: 'nature',
      label: t('nature.title'),
      color: moduleColor('nature', theme),
      values: days.map((day) => (history[day]?.natureMinutes ?? 0) > 0),
    },
    {
      id: 'sauna',
      label: t('practices.sauna'),
      color: moduleColor('sauna', theme),
      values: days.map((day) => (history[day]?.saunaMinutes ?? 0) > 0),
    },
  ];

  const totals = days.reduce(
    (acc, day) => {
      const record = history[day];
      acc.cold += record?.coldMinutes ?? 0;
      acc.nature += record?.natureMinutes ?? 0;
      acc.sauna += record?.saunaMinutes ?? 0;
      return acc;
    },
    { cold: 0, nature: 0, sauna: 0 },
  );
  const weekHits = matrixRows.reduce((sum, row) => sum + row.values.filter(Boolean).length, 0);
  const hairline = themeName === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(14,26,43,0.08)';
  const cardBg = themeName === 'dark' ? `${theme.surface}E6` : theme.surface;
  const locale = localeForLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText style={Type.display}>{t('you.title')}</ThemedText>
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                {t('you.statusMeta')}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => router.push('/settings' as never)}
              accessibilityLabel={t('you.settings')}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              {Platform.OS === 'ios' ? (
                <SymbolView name="gearshape" size={22} tintColor={theme.textSecondary} />
              ) : (
                <Text style={{ fontSize: 20, color: theme.textSecondary }}>⚙</Text>
              )}
            </Pressable>
          </View>

          {/* Rank hero — editorial, czysta typografia (Letterboxd), bez trofeów */}
          <View style={styles.rankHero}>
            <ThemedText style={[styles.rankKicker, { color: theme.gold }]}>
              {t('you.currentRank').toUpperCase()}
            </ThemedText>
            <ThemedText style={styles.rankName}>{t(`ranks.${rank}`).toUpperCase()}</ThemedText>
            <View style={styles.rankProgress}>
              <LinearProgress value={progress} color={theme.gold} />
              <View style={styles.rankMetaRow}>
                <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                  {isMaxRank
                    ? t('you.maxRank')
                    : t('you.nextRank', {
                        rank: t(`ranks.${next}`),
                        earned: earnedInRank,
                        required: requiredInRank,
                      })}
                </ThemedText>
                <ThemedText style={[Type.caption, { color: theme.textSecondary }]}> 
                  {isMaxRank ? t('you.totalXpValue', { count: xp }) : t('you.xpRemaining', { count: xpRemaining })}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Grid statystyk — patern Open: liczby i labelki, hairline między rzędami */}
          <View
            style={[
              styles.statsCard,
              { backgroundColor: cardBg },
              themeName === 'light' && styles.lightShadow,
            ]}>
            <View style={styles.statRow}>
              <StatCell value={`${streak}`} label={t('you.statStreak')} />
              <StatCell value={`${weekHits}`} label={t('you.weekHits')} />
              <StatCell
                value={`${totals.cold + totals.nature + totals.sauna}`}
                label={t('you.activeMinutes')}
              />
            </View>
            <View style={[styles.statDivider, { backgroundColor: hairline }]} />
            <View style={styles.statRow}>
              <StatCell value={`${totals.cold}`} label={t('you.coldMinutes')} color={theme.frost} />
              <StatCell
                value={`${totals.nature}`}
                label={t('you.natureMinutes')}
                color={theme.aurora}
              />
              <StatCell value={`${totals.sauna}`} label={t('you.saunaMinutes')} color={theme.ember} />
            </View>
          </View>

          <HabitMatrix rows={matrixRows} dateKeys={days} />

          <SectionHeader title={t('you.recentActivity')} />
          <View
            style={[
              styles.activityCard,
              { backgroundColor: cardBg },
              themeName === 'light' && styles.lightShadow,
            ]}>
            {xpLog.slice(0, 6).map((event, index) => (
              <View key={`${event.at}-${event.sourceKey}`}>
                {index > 0 && <View style={[styles.activityDivider, { backgroundColor: hairline }]} />}
                <View style={styles.activityRow}>
                  <View style={styles.activityText}>
                    <ThemedText style={Type.body}>{t(event.sourceKey)}</ThemedText>
                    <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                      {new Date(event.at).toLocaleDateString(locale)}
                    </ThemedText>
                  </View>
                  <ThemedText style={[Type.body, styles.activityXp, { color: theme.aurora }]}>
                    {t('common.xp', { count: event.amount })}
                  </ThemedText>
                </View>
              </View>
            ))}
            {xpLog.length === 0 ? (
              <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
                {t('you.noActivity')}
              </ThemedText>
            ) : null}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rankHero: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  rankKicker: {
    ...Type.caption,
    letterSpacing: 2,
  },
  rankName: {
    fontFamily: Type.display.fontFamily,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: 1,
  },
  rankProgress: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  rankMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  statsCard: {
    borderRadius: Radius.card,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCell: {
    flex: 1,
    gap: 3,
  },
  statValue: {
    fontFamily: Type.display.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontFamily: Type.caption.fontFamily,
  },
  statDivider: {
    height: StyleSheet.hairlineWidth,
  },
  lightShadow: {
    boxShadow: '0 2px 8px rgba(14, 26, 43, 0.06)',
  },
  activityCard: {
    borderRadius: Radius.card,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  activityDivider: {
    height: StyleSheet.hairlineWidth,
  },
  activityText: {
    flex: 1,
    gap: 2,
  },
  activityXp: {
    fontVariant: ['tabular-nums'],
  },
});
