import { BottomSheet, RNHostView } from '@expo/ui';
import { environment, presentationBackground } from '@expo/ui/swift-ui/modifiers';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { SheetCloseButton } from '@/components/sheet-close-button';
import { ThemedText } from '@/components/themed-text';
import { STREAK_SCORE_THRESHOLD } from '@/config/app';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { localeForLanguage } from '@/lib/locale';
import type { DayRecord } from '@/stores/progress';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  streak: number;
  streakKeys: string[];
  history: Record<string, DayRecord>;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function StreakBottomSheet({ visible, onDismiss, streak, streakKeys, history, t }: Props) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const locale = localeForLanguage(i18n.resolvedLanguage ?? i18n.language);
  const activeDays = streakKeys.filter((key) => (history[key]?.score ?? 0) >= STREAK_SCORE_THRESHOLD).length;
  const todayKey = streakKeys[streakKeys.length - 1];
  const todayScore = todayKey ? (history[todayKey]?.score ?? 0) : 0;

  return (
    <BottomSheet
      key={themeName}
      isPresented={visible}
      onDismiss={onDismiss}
      showDragIndicator
      snapPoints={['half', 'full']}
      modifiers={
        Platform.OS === 'ios'
          ? [environment('colorScheme', themeName), presentationBackground(theme.bg)]
          : undefined
      }
      testID="streak-bottom-sheet">
      <RNHostView>
        <View style={[styles.sheetRoot, { backgroundColor: theme.bg }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.host}
          showsVerticalScrollIndicator={false}
          bounces>
          <View style={styles.sheetHeader}>
            <ThemedText style={Type.h1}>{t('home.streakSheetTitle')}</ThemedText>
            <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
              {t('home.streakSheetSubtitle', { count: STREAK_SCORE_THRESHOLD })}
            </ThemedText>
          </View>

          <LinearGradient
            colors={[`${theme.ember}24`, `${theme.frost}18`, `${theme.aurora}14`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.streakWidget, { borderColor: theme.border }]}>
            <View style={styles.widgetTop}>
              <View style={[styles.sheetIcon, { backgroundColor: `${theme.ember}24` }]}>
                {Platform.OS === 'ios' ? (
                  <SymbolView name="flame.fill" size={26} tintColor={theme.ember} />
                ) : (
                  <ThemedText style={[Type.h1, { color: theme.ember }]}>🔥</ThemedText>
                )}
              </View>
              <View style={[styles.thresholdPill, { backgroundColor: `${theme.surface}CC` }]}>
                <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                  {t('home.scoreNeeded')} {STREAK_SCORE_THRESHOLD}
                </ThemedText>
              </View>
            </View>

            <View style={styles.streakNumberRow}>
              <ThemedText style={[Type.timer, styles.streakNumber, { color: theme.ember }]}>{streak}</ThemedText>
              <View style={styles.streakNumberText}>
                <ThemedText style={Type.h2}>{t('home.currentStreak')}</ThemedText>
                <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                  {activeDays}/7 · {t('home.score')} {todayScore}
                </ThemedText>
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.weekPanel, { backgroundColor: theme.surfaceHigh }]}>
            <View style={styles.weekHeader}>
              <ThemedText style={Type.h2}>{t('you.last7Days')}</ThemedText>
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>{activeDays}/7</ThemedText>
            </View>
            <View style={styles.streakRail}>
            {streakKeys.map((key) => {
              const active = (history[key]?.score ?? 0) >= STREAK_SCORE_THRESHOLD;
              const score = history[key]?.score ?? 0;
              return (
                <View key={key} style={styles.streakDay}>
                  <View style={[styles.streakDayTrack, { backgroundColor: theme.surface }]}>
                    <View
                      style={[
                        styles.streakDayFill,
                        {
                          height: `${Math.min(score, 100)}%`,
                          backgroundColor: active ? theme.aurora : `${theme.textSecondary}55`,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                    {new Date(`${key}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2)}
                  </ThemedText>
                </View>
              );
            })}
            </View>
          </View>

          <View style={[styles.ruleCard, { backgroundColor: theme.surfaceHigh }]}>
            {(['score', 'calendar', 'reset'] as const).map((rule, index) => (
              <View key={rule}>
                {index > 0 && (
                  <View style={[styles.ruleDivider, { backgroundColor: `${theme.textSecondary}22` }]} />
                )}
                <View style={styles.ruleRow}>
                  <ThemedText style={[styles.ruleNumber, { color: theme.frost }]}>
                    {String(index + 1).padStart(2, '0')}
                  </ThemedText>
                  <ThemedText style={[Type.body, styles.ruleText, { color: theme.textSecondary }]}>
                    {t(`home.streakRules.${rule}`, { count: STREAK_SCORE_THRESHOLD })}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.closeFloat}>
          <SheetCloseButton onPress={onDismiss} />
        </View>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  host: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sheetHeader: {
    gap: Spacing.one,
    paddingRight: 60,
  },
  closeFloat: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.three,
  },
  sheetIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeroText: {
    flex: 1,
    gap: Spacing.one,
  },
  streakWidget: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.four,
    borderWidth: 1,
  },
  widgetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  thresholdPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  streakNumber: {
    fontSize: 72,
    lineHeight: 76,
  },
  streakNumberText: {
    flex: 1,
    paddingBottom: Spacing.two,
    gap: 2,
  },
  weekPanel: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  streakRail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  streakDay: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  streakDayTrack: {
    width: 28,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  streakDayFill: {
    width: '100%',
    borderRadius: 14,
  },
  ruleCard: {
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  ruleDivider: {
    height: StyleSheet.hairlineWidth,
  },
  ruleNumber: {
    ...Type.caption,
    fontFamily: Type.h2.fontFamily,
    letterSpacing: 1,
    lineHeight: 22,
  },
  ruleText: {
    flex: 1,
  },
});
