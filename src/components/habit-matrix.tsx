import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { localeForLanguage } from '@/lib/locale';

export type HabitMatrixRow = {
  id: string;
  label: string;
  color: string;
  values: boolean[];
};

type Props = {
  rows: HabitMatrixRow[];
  dateKeys: string[];
};

function weekdayLabel(key: string, locale: string): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2);
}

export function HabitMatrix({ rows, dateKeys }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const todayKey = dateKeys[dateKeys.length - 1];
  const locale = localeForLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface },
        themeName === 'light' && styles.lightShadow,
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <ThemedText style={Type.h2}>{t('you.weekSignal')}</ThemedText>
          <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
            {t('you.weekSignalMeta')}
          </ThemedText>
        </View>
        <View style={[styles.todayPill, { backgroundColor: `${theme.frost}1F` }]}>
          <ThemedText style={[Type.caption, { color: theme.frost }]}>{t('home.today')}</ThemedText>
        </View>
      </View>

      <View style={styles.dayRail}>
        {dateKeys.map((key) => (
          <View key={key} style={styles.dayRailItem}>
            <ThemedText style={[Type.caption, styles.dayRailLabel, { color: key === todayKey ? theme.frost : theme.textSecondary }]}>
              {weekdayLabel(key, locale)}
            </ThemedText>
            <ThemedText style={[Type.caption, styles.dayRailNumber, { color: key === todayKey ? theme.textPrimary : theme.textSecondary }]}>
              {key.slice(8)}
            </ThemedText>
          </View>
        ))}
      </View>

      {rows.map((row) => (
        <View key={row.id} style={styles.row}>
          <View style={styles.rowMeta}>
            <ThemedText style={Type.body} numberOfLines={1}>
              {row.label}
            </ThemedText>
            <ThemedText style={[Type.caption, { color: row.color }]}>
              {row.values.filter(Boolean).length}/7
            </ThemedText>
          </View>
          <View style={styles.dots}>
            {row.values.map((done, index) => {
              const isToday = dateKeys[index] === todayKey;
              return (
                <View
                  key={`${row.id}-${dateKeys[index]}`}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: done ? row.color : `${theme.surfaceHigh}B8`,
                      borderColor: isToday ? theme.frost : done ? row.color : `${theme.border}99`,
                      opacity: done ? 1 : 0.72,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  lightShadow: {
    boxShadow: '0 2px 8px rgba(14, 26, 43, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  todayPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dayRail: {
    flexDirection: 'row',
    paddingLeft: 122,
    gap: 6,
  },
  dayRailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  dayRailLabel: {
    textAlign: 'center',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dayRailNumber: {
    textAlign: 'center',
    fontSize: 11,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowMeta: {
    width: 112,
    gap: 1,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dot: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 22,
    borderRadius: 9,
    borderWidth: 1,
  },
});
