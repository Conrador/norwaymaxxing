import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  tintColor?: string;
};

export function BackButton({ label, onPress, tintColor }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={12}
      style={styles.button}>
      <SymbolView
        name="chevron.left"
        size={20}
        tintColor={tintColor ?? theme.frost}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    width: 46,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.one,
  },
});
