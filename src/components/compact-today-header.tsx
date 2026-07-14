import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { StreakPill } from '@/components/streak-pill';
import { ThemedText } from '@/components/themed-text';
import { STREAK_SCORE_THRESHOLD } from '@/config/app';
import { Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { currentWeekKeys, dateKey } from '@/lib/dates';
import { useProgress } from '@/stores/progress';

type Props = {
  active: boolean;
  cursorDate: Date;
  selectedDate: Date;
  dayLetters: string[];
  minimumDateKey?: string;
  score: number;
  streak: number;
  scrollY: SharedValue<number>;
  revealStart: number;
  revealEnd: number;
  topInset: number;
  onSelectDate: (date: Date) => void;
  onStreakPress: () => void;
};

export function CompactTodayHeader({
  active,
  cursorDate,
  selectedDate,
  dayLetters,
  minimumDateKey,
  score,
  streak,
  scrollY,
  revealStart,
  revealEnd,
  topInset,
  onSelectDate,
  onStreakPress,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const history = useProgress((s) => s.history);
  const weekKeys = currentWeekKeys(cursorDate);
  const todayKey = dateKey();
  const selectedKey = dateKey(selectedDate);
  const reducedMotion = useReducedMotion();
  const animatedScore = useSharedValue(Math.min(Math.max(score / 100, 0), 1));

  useEffect(() => {
    animatedScore.value = withTiming(Math.min(Math.max(score / 100, 0), 1), {
      duration: reducedMotion ? 0 : 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedScore, reducedMotion, score]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [revealStart, revealEnd], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [revealStart, revealEnd], [-18, 0], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [revealStart, revealEnd], [0.97, 1], Extrapolation.CLAMP) },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedScore.value * 100}%`,
  }));

  return (
    <Animated.View
      pointerEvents={active ? 'auto' : 'none'}
      style={[styles.root, { paddingTop: topInset + Spacing.two }, animatedStyle]}>
      <BlurView
        intensity={themeName === 'dark' ? 34 : 46}
        tint={themeName === 'dark' ? 'dark' : 'light'}
        style={[
          styles.glass,
          {
            backgroundColor: themeName === 'dark' ? 'rgba(10, 16, 29, 0.70)' : 'rgba(255, 255, 255, 0.72)',
            borderColor: themeName === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.76)',
            boxShadow:
              themeName === 'dark'
                ? '0 14px 34px rgba(0, 0, 0, 0.22)'
                : '0 14px 34px rgba(24, 32, 52, 0.12)',
          },
        ]}>
        <View style={styles.topRow}>
          <View style={styles.daysRow}>
            {weekKeys.map((key, index) => {
              const disabled = Boolean(minimumDateKey && key < minimumDateKey);
              const done = !disabled && (history[key]?.score ?? 0) >= STREAK_SCORE_THRESHOLD;
              const isToday = key === todayKey;
              const isSelected = !disabled && key === selectedKey;
              const dayNumber = Number(key.slice(-2));
              const date = new Date(`${key}T12:00:00`);

              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key}
                  accessibilityState={{ disabled }}
                  disabled={disabled}
                  onPress={() => onSelectDate(date)}
                  style={({ pressed }) => [
                    styles.day,
                    {
                      backgroundColor: isSelected
                        ? theme.frost
                        : done
                          ? `${theme.aurora}24`
                          : 'transparent',
                      opacity: disabled ? 0.24 : pressed ? 0.72 : 1,
                    },
                  ]}>
                  <ThemedText
                    style={[
                      styles.dayLabel,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isToday
                            ? theme.textPrimary
                            : theme.textSecondary,
                      },
                    ]}>
                    {dayLetters[index] ?? ''}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.dayNumber,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : done
                            ? theme.aurora
                            : isToday
                              ? theme.frost
                              : theme.textPrimary,
                      },
                    ]}>
                    {dayNumber}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.openStreakDetails')}
            onPress={onStreakPress}
            style={({ pressed }) => [styles.streakButton, { opacity: pressed ? 0.76 : 1 }]}>
            <StreakPill streak={streak} compact />
          </Pressable>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: themeName === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(14,26,43,0.10)' }]}> 
          <Animated.View style={[styles.progressFill, { backgroundColor: theme.aurora }, progressStyle]} />
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 10,
  },
  glass: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 0,
  },
  day: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    paddingVertical: 7,
    paddingHorizontal: 5,
  },
  dayLabel: {
    ...Type.caption,
    fontSize: 9,
    lineHeight: 11,
  },
  dayNumber: {
    ...Type.caption,
    fontSize: 13,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  streakButton: {
    width: 52,
    minHeight: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
