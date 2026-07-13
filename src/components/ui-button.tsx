import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  /** prominent = wypełniony CTA, glass = drugorzędny, destructive = czerwony */
  variant?: 'prominent' | 'glass' | 'destructive';
  tintColor?: string;
  disabled?: boolean;
};

/** RN/web fallback. iOS uses ui-button.ios.tsx with SwiftUI Button. */
export function UiButton({ label, onPress, variant = 'glass', tintColor, disabled = false }: Props) {
  const theme = useTheme();
  const resolvedTint =
    tintColor ?? (variant === 'destructive' ? theme.blood : theme.frost);

  const background =
    variant === 'prominent'
      ? resolvedTint
      : variant === 'destructive'
        ? `${theme.blood}22`
        : theme.surfaceHigh;
  const color =
    variant === 'prominent' ? '#FFFFFF' : variant === 'destructive' ? theme.blood : theme.textPrimary;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: background, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}>
      <ThemedText style={[Type.body, { color, fontFamily: Type.h2.fontFamily }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
});
