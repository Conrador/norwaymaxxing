import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  meta?: string;
};

export function SectionHeader({ title, meta }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <ThemedText style={Type.h2}>{title}</ThemedText>
      {meta ? (
        <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>{meta}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
