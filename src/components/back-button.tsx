import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  tintColor?: string;
};

export function BackButton({ label, onPress, tintColor }: Props) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.button}>
      <ThemedText style={[Type.body, { color: tintColor ?? theme.frost }]}>‹ {label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: 34,
    justifyContent: 'center',
    marginLeft: -Spacing.one,
  },
});
