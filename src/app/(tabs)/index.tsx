import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactTodayHeader } from '@/components/compact-today-header';
import { DashboardHero } from '@/components/dashboard-hero';
import { ProgressRing } from '@/components/progress-ring';
import { ScreenBackground } from '@/components/screen-background';
import { StreakPill } from '@/components/streak-pill';
import { StreakBottomSheet } from '@/components/streak-bottom-sheet';
import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { WeekStrip } from '@/components/week-strip';
import { BottomTabInset, CardGap, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { generateDailyProtocol } from '@/features/protocol/protocol';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { dateKey, lastNDays, startOfWeek } from '@/lib/dates';
import { localeForLanguage } from '@/lib/locale';
import { useProfile } from '@/stores/profile';
import { useProgress } from '@/stores/progress';

const COMPACT_HEADER_REVEAL_START = 300;
const COMPACT_HEADER_REVEAL_END = 380;

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const profile = useProfile((s) => s.profile);
  const cold30Day = useProgress((s) => s.cold30Day);
  const streak = useProgress((s) => s.streak);
  const completeTask = useProgress((s) => s.completeTask);
  const reconcileDay = useProgress((s) => s.reconcileDay);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarCursorDate, setCalendarCursorDate] = useState(() => new Date());
  const [streakSheetOpen, setStreakSheetOpen] = useState(false);
  const [compactHeaderActive, setCompactHeaderActive] = useState(false);
  const selectedDateKey = dateKey(selectedDate);
  const dayRecord = useProgress((s) => s.history[selectedDateKey]);
  const history = useProgress((s) => s.history);

  const tasks = useMemo(
    () => generateDailyProtocol(profile, cold30Day, selectedDate),
    [profile, cold30Day, selectedDate],
  );
  const tasksDone = dayRecord?.tasksDone ?? [];
  const protocolTaskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const completedTaskCount = protocolTaskIds.filter((id) => tasksDone.includes(id)).length;
  const score = tasks.length ? Math.round((completedTaskCount / tasks.length) * 100) : 0;
  const dayLetters = t('home.dayLetters', { returnObjects: true }) as string[];
  const streakKeys = useMemo(() => lastNDays(7), []);
  const locale = localeForLanguage(i18n.resolvedLanguage ?? i18n.language);

  useEffect(() => {
    reconcileDay(selectedDateKey, protocolTaskIds);
  }, [protocolTaskIds, reconcileDay, selectedDateKey]);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useAnimatedReaction(
    () => scrollY.value > COMPACT_HEADER_REVEAL_START,
    (active, previousActive) => {
      if (active !== previousActive) {
        runOnJS(setCompactHeaderActive)(active);
      }
    },
  );

  const heroContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 220, 320], [1, 0.78, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 320], [0, -42], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [0, 320], [1, 0.96], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <ScreenBackground>
      <Animated.ScrollView
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scroll}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <DashboardHero>
          <Animated.View style={[styles.heroContent, heroContentStyle]}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <ThemedText
                  style={[
                    styles.heroDate,
                    { color: themeName === 'dark' ? '#EAF8FF' : '#183249' },
                    themeName === 'dark' && styles.heroTextShadow,
                  ]}>
                  {selectedDate
                    .toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
                    .toUpperCase()}
                </ThemedText>
                <ThemedText
                  style={[
                    Type.display,
                    { color: themeName === 'dark' ? '#FFFFFF' : '#0E1A2B' },
                    themeName === 'dark' && styles.heroGreetingShadow,
                  ]}>
                  {t('home.greeting')}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('home.streakSheetTitle')}
                onPress={() => setStreakSheetOpen(true)}
                style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                <StreakPill streak={streak} />
              </Pressable>
            </View>

            <WeekStrip
              cursorDate={calendarCursorDate}
              selectedDate={selectedDate}
              dayLetters={dayLetters}
              onCursorDateChange={(date) => {
                setCalendarCursorDate(date);
                setSelectedDate(startOfWeek(date));
              }}
              onSelectDate={setSelectedDate}
            />

            <View style={styles.hero}>
              <ProgressRing
                size={216}
                strokeWidth={16}
                progress={score / 100}
                color={theme.aurora}
                trackColor={themeName === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(14,26,43,0.13)'}>
                <ThemedText style={[Type.timer, styles.scoreText]}>
                  {score}
                </ThemedText>
                <ThemedText
                  style={[Type.caption, { color: themeName === 'dark' ? '#D7E8F7' : theme.textSecondary, letterSpacing: 2 }]}>
                  {t('home.score').toUpperCase()}
                </ThemedText>
              </ProgressRing>
            </View>
          </Animated.View>
        </DashboardHero>

        <View
          style={[
            styles.protocolPanel,
            {
              backgroundColor: theme.bg,
              boxShadow:
                themeName === 'dark'
                  ? '0 -18px 42px rgba(0, 0, 0, 0.20)'
                  : '0 -18px 38px rgba(43, 52, 77, 0.08)',
            },
          ]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={Type.h2}>{t('home.todayProtocol')}</ThemedText>
            <ThemedText style={[Type.h2, styles.protocolCount, { color: theme.textSecondary }]}>
              {completedTaskCount}/{tasks.length}
            </ThemedText>
          </View>

          <View style={styles.tasks}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                done={tasksDone.includes(task.id)}
                onPress={() => {
                  if (task.session === 'cold') {
                    router.push({
                      pathname: '/cold-session',
                      params: { day: String(cold30Day), date: selectedDateKey },
                    });
                  } else if (task.session === 'sauna') {
                    router.push({
                      pathname: '/sauna',
                      params: { date: selectedDateKey, taskIds: protocolTaskIds.join(',') },
                    });
                  } else if (task.session === 'breath' || task.module === 'breath') {
                    router.push({
                      pathname: '/breath',
                      params: {
                        date: selectedDateKey,
                        taskId: task.id,
                        taskIds: protocolTaskIds.join(','),
                      },
                    });
                  } else if (task.session === 'ro') {
                    router.push({
                      pathname: '/ro-session',
                      params: { date: selectedDateKey, taskIds: protocolTaskIds.join(',') },
                    });
                  } else if (task.session === 'music') {
                    router.push({
                      pathname: '/kygo-jo',
                      params: { date: selectedDateKey, taskIds: protocolTaskIds.join(',') },
                    });
                  } else {
                    completeTask(selectedDateKey, task, protocolTaskIds);
                  }
                }}
              />
            ))}
          </View>

        </View>
      </Animated.ScrollView>
      <CompactTodayHeader
        active={compactHeaderActive}
        cursorDate={calendarCursorDate}
        selectedDate={selectedDate}
        dayLetters={dayLetters}
        score={score}
        streak={streak}
        scrollY={scrollY}
        revealStart={COMPACT_HEADER_REVEAL_START}
        revealEnd={COMPACT_HEADER_REVEAL_END}
        topInset={insets.top}
        onSelectDate={setSelectedDate}
        onStreakPress={() => setStreakSheetOpen(true)}
      />
      <StreakBottomSheet
        visible={streakSheetOpen}
        onDismiss={() => setStreakSheetOpen(false)}
        streak={streak}
        streakKeys={streakKeys}
        history={history}
        t={t}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 0,
    paddingBottom: BottomTabInset + Spacing.six + Spacing.three,
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  heroContent: {
    gap: Spacing.four,
  },
  heroDate: {
    ...Type.caption,
    letterSpacing: 1.5,
  },
  heroTextShadow: {
    textShadowColor: 'rgba(0,0,0,0.24)',
    textShadowRadius: 10,
  },
  heroGreetingShadow: {
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowRadius: 14,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  scoreText: {
    fontSize: 60,
    lineHeight: 68,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowRadius: 12,
  },
  protocolPanel: {
    marginTop: -Spacing.four,
    marginHorizontal: -ScreenPadding,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.four,
    gap: Spacing.three,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  protocolCount: {
    fontVariant: ['tabular-nums'],
  },
  tasks: {
    gap: CardGap,
  },
});
