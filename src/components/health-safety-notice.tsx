import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { SourcesLink } from '@/components/sources-link';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Type } from '@/constants/theme';
import type { SourceGroup } from '@/features/content/sources';
import { useTheme } from '@/hooks/use-theme';

type HealthSafetyNoticeProps = {
  text: string;
  module?: SourceGroup['module'];
};

export function HealthSafetyNotice({ text, module }: HealthSafetyNoticeProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.notice,
        {
          backgroundColor: `${theme.gold}14`,
          borderColor: `${theme.gold}33`,
        },
      ]}>
      <SymbolView
        name="exclamationmark.triangle.fill"
        size={17}
        tintColor={theme.gold}
        style={styles.icon}
      />
      <View style={styles.body}>
        <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
          {text}
        </ThemedText>
        {module ? <SourcesLink module={module} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: Spacing.two,
  },
});
