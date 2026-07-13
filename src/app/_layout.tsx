import '@/i18n';

import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces';
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_700Bold,
} from '@expo-google-fonts/schibsted-grotesk';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Colors, Fonts } from '@/constants/theme';
import { useThemeName } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const themeName = useThemeName();
  const [fontsLoaded] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_700Bold,
    Fraunces_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const palette = Colors[themeName];
  const base = themeName === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.frost,
      background: palette.bg,
      card: palette.surface,
      text: palette.textPrimary,
      border: palette.border,
      notification: palette.blood,
    },
    fonts: {
      ...base.fonts,
      regular: { fontFamily: Fonts.sans, fontWeight: '400' as const },
      medium: { fontFamily: Fonts.sansMedium, fontWeight: '500' as const },
      bold: { fontFamily: Fonts.sansBold, fontWeight: '700' as const },
      heavy: { fontFamily: Fonts.sansBold, fontWeight: '700' as const },
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cold" />
        <Stack.Screen name="sauna" />
        <Stack.Screen name="breath" />
        <Stack.Screen name="diet" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="challenge/[id]" />
        <Stack.Screen name="cold-session" />
        <Stack.Screen
          name="ro-session"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="kygo-jo" options={{ gestureEnabled: true }} />
      </Stack>
    </ThemeProvider>
  );
}
