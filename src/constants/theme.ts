/**
 * Norwaymaxxing design tokens — "Polar Day" (light) / "Polar Night" (dark).
 * Semantic colors per design.md §2. Template keys (text, background,
 * backgroundElement, backgroundSelected) are kept as aliases so shared
 * themed components keep working.
 */

import '@/global.css';

import { Platform } from 'react-native';

const night = {
  bg: '#0B1220',
  surface: '#131C2E',
  surfaceHigh: '#1B2740',
  border: '#263353',
  textPrimary: '#F1F5F9',
  textSecondary: '#8CA3C3',
  frost: '#5EC8F2',
  aurora: '#3DDC97',
  ember: '#F5A623',
  blood: '#E5484D',
  gold: '#E8C468',
} as const;

const day = {
  bg: '#F6F3FA',
  surface: '#FFFFFF',
  surfaceHigh: '#EFE8F8',
  border: '#DED8E8',
  textPrimary: '#0E1A2B',
  textSecondary: '#51647F',
  frost: '#0E7FB8',
  aurora: '#0F9D6B',
  ember: '#C97B06',
  blood: '#C93A3F',
  gold: '#9A7A2E',
} as const;

export const Colors = {
  light: {
    ...day,
    text: day.textPrimary,
    background: day.bg,
    backgroundElement: day.surface,
    backgroundSelected: day.surfaceHigh,
  },
  dark: {
    ...night,
    text: night.textPrimary,
    background: night.bg,
    backgroundElement: night.surface,
    backgroundSelected: night.surfaceHigh,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = { readonly [K in ThemeColor]: string };

export const Fonts = Platform.select({
  web: {
    sans: 'SchibstedGrotesk_400Regular, sans-serif',
    sansMedium: 'SchibstedGrotesk_500Medium, sans-serif',
    sansBold: 'SchibstedGrotesk_700Bold, sans-serif',
    accent: 'Fraunces_400Regular_Italic, serif',
    mono: 'ui-monospace, monospace',
  },
  default: {
    sans: 'SchibstedGrotesk_400Regular',
    sansMedium: 'SchibstedGrotesk_500Medium',
    sansBold: 'SchibstedGrotesk_700Bold',
    accent: 'Fraunces_400Regular_Italic',
    mono: Platform.OS === 'ios' ? 'ui-monospace' : 'monospace',
  },
});

export const Type = {
  display: { fontFamily: Fonts.sansBold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: Fonts.sansBold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: Fonts.sansMedium, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  timer: {
    fontFamily: Fonts.sansBold,
    fontSize: 64,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
} satisfies Record<string, import('react-native').TextStyle>;

export const Radius = {
  card: 22,
  control: 16,
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const ScreenPadding = 20;
export const CardGap = 12;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
