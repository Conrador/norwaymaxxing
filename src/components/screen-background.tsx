import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useThemeName } from '@/hooks/use-theme';

/**
 * Pełnoekranowe tło "noc polarna / dzień polarny" (design.md §2) — subtelny
 * pionowy gradient zamiast płaskiego koloru, jak w QUITTR/Hatch.
 */
export function ScreenBackground({ children }: { children: ReactNode }) {
  const themeName = useThemeName();
  const colors =
    themeName === 'dark'
      ? (['#12283A', '#0C1728', '#08111F'] as const)
      : (['#F1EAFD', '#F6F0F4', '#F7F8FC'] as const);

  return (
    <LinearGradient colors={colors} locations={[0, 0.45, 1]} style={styles.fill}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
