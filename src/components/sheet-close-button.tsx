import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  onPress: () => void;
};

/**
 * X rysowany dwoma obróconymi paskami (nie SymbolView) — natywne expo-symbols
 * nie renderują się zagnieżdżone w RNHostView natywnego bottom sheetu.
 */
export function SheetCloseButton({ onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t('common.close')}
      style={[styles.button, { backgroundColor: theme.surfaceHigh }]}>
      <View style={styles.glyph}>
        <View style={[styles.bar, { backgroundColor: theme.textPrimary, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.bar, { backgroundColor: theme.textPrimary, transform: [{ rotate: '-45deg' }] }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    width: 16,
    height: 2,
    borderRadius: 1,
  },
});
