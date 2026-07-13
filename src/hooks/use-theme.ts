/**
 * Theme resolution: manual override from settings wins, otherwise system scheme.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/stores/settings';

export function useThemeName(): 'light' | 'dark' {
  const scheme = useColorScheme();
  const mode = useSettings((s) => s.themeMode);
  if (mode !== 'system') return mode;
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  return Colors[useThemeName()];
}
