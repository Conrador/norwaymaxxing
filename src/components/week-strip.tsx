import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, FadeOutLeft, FadeOutRight } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { STREAK_SCORE_THRESHOLD } from '@/config/app';
import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addMonths, addWeeks, currentWeekKeys, dateKey } from '@/lib/dates';
import { localeForLanguage } from '@/lib/locale';
import { useProgress } from '@/stores/progress';

type Props = {
  cursorDate: Date;
  selectedDate: Date;
  dayLetters: string[];
  onCursorDateChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
};

function monthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function CalendarButton({
  icon,
  fallback,
  label,
  onPress,
}: {
  icon: SFSymbol;
  fallback: string;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navButton,
        { backgroundColor: `${theme.surface}CC`, opacity: pressed ? 0.65 : 1 },
      ]}>
      {Platform.OS === 'ios' ? (
        <SymbolView name={icon} size={14} tintColor={theme.textPrimary} />
      ) : (
        <Text style={[styles.navFallback, { color: theme.textPrimary }]}>
          {fallback}
        </Text>
      )}
    </Pressable>
  );
}

export function WeekStrip({
  cursorDate,
  selectedDate,
  dayLetters,
  onCursorDateChange,
  onSelectDate,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const history = useProgress((s) => s.history);
  const [direction, setDirection] = useState(1);
  const locale = localeForLanguage(i18n.resolvedLanguage ?? i18n.language);
  const weekKeys = currentWeekKeys(cursorDate);
  const todayKey = dateKey();
  const selectedKey = dateKey(selectedDate);
  const weekStartKey = weekKeys[0];

  function navigate(date: Date, nextDirection: number) {
    setDirection(nextDirection);
    onCursorDateChange(date);
  }

  return (
    <View style={[styles.shell, { backgroundColor: theme.surfaceHigh }]}>
      <View style={styles.header}>
        <CalendarButton
          icon="chevron.backward.2"
          fallback="«"
          label={t('common.previousMonth')}
          onPress={() => navigate(addMonths(cursorDate, -1), -1)}
        />
        <CalendarButton
          icon="chevron.left"
          fallback="‹"
          label={t('common.previousWeek')}
          onPress={() => navigate(addWeeks(cursorDate, -1), -1)}
        />
        <Pressable
          onPress={() => {
            const today = new Date();
            setDirection(todayKey >= weekStartKey ? 1 : -1);
            onCursorDateChange(today);
            onSelectDate(today);
          }}
          style={({ pressed }) => [styles.monthPressable, { opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText style={[Type.h2, styles.monthLabel]}>
            {monthLabel(cursorDate, locale)}
          </ThemedText>
        </Pressable>
        <CalendarButton
          icon="chevron.right"
          fallback="›"
          label={t('common.nextWeek')}
          onPress={() => navigate(addWeeks(cursorDate, 1), 1)}
        />
        <CalendarButton
          icon="chevron.forward.2"
          fallback="»"
          label={t('common.nextMonth')}
          onPress={() => navigate(addMonths(cursorDate, 1), 1)}
        />
      </View>

      <Animated.View
        key={weekStartKey}
        entering={(direction < 0 ? FadeInLeft : FadeInRight).duration(180)}
        exiting={(direction < 0 ? FadeOutRight : FadeOutLeft).duration(120)}
        style={styles.daysRow}>
        {weekKeys.map((key, i) => {
          const done = (history[key]?.score ?? 0) >= STREAK_SCORE_THRESHOLD;
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const isPast = key < todayKey;
          const dayNumber = Number(key.slice(-2));
          const date = new Date(`${key}T12:00:00`);

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(date)}
              style={[
                styles.day,
                isSelected && { backgroundColor: theme.surface },
              ]}>
              <ThemedText
                style={[
                  Type.caption,
                  {
                    color: isSelected ? theme.frost : isToday ? theme.textPrimary : theme.textSecondary,
                    fontSize: 11,
                  },
                ]}>
                {dayLetters[i] ?? ''}
              </ThemedText>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: done
                      ? theme.aurora
                      : isSelected
                        ? theme.frost
                        : `${theme.surfaceHigh}B0`,
                    opacity: !done && isPast && !isSelected ? 0.48 : 1,
                  },
                  isToday && !isSelected && styles.todayRing,
                  isToday && !isSelected && { borderColor: theme.frost },
                  isSelected && { borderColor: theme.frost },
                ]}>
                {done ? (
                  <Text style={styles.check}>✓</Text>
                ) : (
                  <ThemedText
                    style={[
                      Type.caption,
                      { color: isSelected ? '#FFFFFF' : isToday ? theme.frost : theme.textSecondary, fontSize: 12 },
                    ]}>
                    {dayNumber}
                  </ThemedText>
                )}
              </View>
              {isToday ? <View style={[styles.todayDot, { backgroundColor: theme.frost }]} /> : <View style={styles.todayDot} />}
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 24,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navFallback: {
    fontSize: 20,
    fontWeight: '700',
  },
  monthPressable: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  monthLabel: {
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    minWidth: 38,
    alignItems: 'center',
    gap: 5,
    borderRadius: 18,
    paddingVertical: 6,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  todayRing: {
    borderWidth: 2,
  },
  check: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
