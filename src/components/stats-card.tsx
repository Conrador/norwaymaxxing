import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';

type Props = {
  label: string;
  value: string;
  accent?: string;
};

export function StatsCard({ label, value, accent }: Props) {
  const theme = useTheme();
  const themeName = useThemeName();
  const color = accent ?? theme.frost;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface },
        themeName === 'light' && styles.lightShadow,
      ]}>
      <ThemedText style={[Type.h1, { color }]}>{value}</ThemedText>
      <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 86,
    borderRadius: Radius.card,
    padding: Spacing.three,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  lightShadow: {
    boxShadow: '0 2px 8px rgba(14, 26, 43, 0.05)',
  },
});
