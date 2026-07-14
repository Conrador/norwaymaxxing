import { SymbolView } from 'expo-symbols';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';

type Props = PropsWithChildren<{
  locked: boolean;
  label: string;
  onPress: () => void;
}>;

export function PremiumGate({ children, label, locked, onPress }: Props) {
  const theme = useTheme();
  const themeName = useThemeName();

  if (!locked) return children;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.root, { opacity: pressed ? 0.86 : 1 }]}>
      <View pointerEvents="none" style={styles.preview}>
        {children}
      </View>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: themeName === 'dark' ? theme.surfaceHigh : theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <SymbolView name="lock.fill" size={14} tintColor={theme.gold} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  preview: {
    opacity: 0.42,
  },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
