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
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { ONBOARDING_ENABLED } from '@/config/app';
import { Colors, Fonts } from '@/constants/theme';
import { OnboardingFlow } from '@/features/onboarding/onboarding-flow';
import { PremiumProvider, usePremium } from '@/hooks/use-premium';
import { useThemeName } from '@/hooks/use-theme';
import { flushOnbornAnalytics, stopOnbornAnalytics } from '@/lib/onborn-analytics';
import { initializeOnborn } from '@/lib/onborn-runtime';
import { useProfile } from '@/stores/profile';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const themeName = useThemeName();
  const onboardingCompleted = useProfile((s) => s.onboardingCompleted);
  const showOnboarding = ONBOARDING_ENABLED && !onboardingCompleted;
  const [onbornEnabled, setOnbornEnabled] = useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_700Bold,
    Fraunces_400Regular_Italic,
  });

  useEffect(() => {
    let active = true;
    void initializeOnborn(showOnboarding ? 'new' : 'returning')
      .then((enabled) => {
        if (active) setOnbornEnabled(enabled);
      })
      .catch((error) => {
        if (__DEV__) console.warn('Unable to initialize Onborn.', error);
        if (active) setOnbornEnabled(false);
      });

    return () => {
      active = false;
    };
  }, [showOnboarding]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void flushOnbornAnalytics();
    });

    return () => {
      subscription.remove();
      void stopOnbornAnalytics();
    };
  }, []);

  if (!fontsLoaded || onbornEnabled === null) return null;

  return (
    <PremiumProvider onbornEnabled={onbornEnabled}>
      <AppContent themeName={themeName} showOnboarding={showOnboarding} />
    </PremiumProvider>
  );
}

function AppContent({
  themeName,
  showOnboarding,
}: {
  themeName: 'light' | 'dark';
  showOnboarding: boolean;
}) {
  const { loading: premiumLoading } = usePremium();

  useEffect(() => {
    if (!premiumLoading) void SplashScreen.hideAsync();
  }, [premiumLoading]);

  if (premiumLoading) return null;

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

  if (showOnboarding) {
    return (
      <ThemeProvider value={navTheme}>
        <OnboardingFlow />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cold" />
        <Stack.Screen name="sauna" />
        <Stack.Screen name="breath" />
        <Stack.Screen name="diet" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', gestureEnabled: true }} />
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
