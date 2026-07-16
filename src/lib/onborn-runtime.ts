import AsyncStorage from '@react-native-async-storage/async-storage';
import { Onborn } from '@onborn/billing';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';

import { useSettings } from '@/stores/settings';

export type OnbornUserType = 'new' | 'returning';

const API_KEY = process.env.EXPO_PUBLIC_ONBORN_SDK_API_KEY?.trim();

let initializationPromise: Promise<boolean> | null = null;
let warnedAboutMissingKey = false;

export function initializeOnborn(userType: OnbornUserType) {
  if (Onborn.getConfig()) return Promise.resolve(true);
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    if (!API_KEY) {
      if (__DEV__ && !warnedAboutMissingKey) {
        warnedAboutMissingKey = true;
        console.warn('Onborn disabled: EXPO_PUBLIC_ONBORN_SDK_API_KEY is missing.');
      }
      return false;
    }

    const deviceLocale = getLocales()[0];
    const locale = useSettings.getState().language ?? deviceLocale?.languageCode ?? 'en';

    // initAsync (not init) so the anonymous user id is read from storage and
    // stays stable across cold starts; the SDK also reports its own version,
    // and the same storage persists the analytics queue and entitlement cache.
    await Onborn.initAsync({
      apiKey: API_KEY,
      appId: Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.norwaymaxxing.norwaymaxxing',
      platform: 'ios',
      appVersion: Constants.expoConfig?.version ?? '1.0.0',
      locale,
      country: deviceLocale?.regionCode ?? undefined,
      userType,
      autoFlushMs: 10_000,
      maxAnalyticsBatchSize: 50,
      analyticsQueueKey: `onborn:analytics:${userType}`,
      analyticsStorage: AsyncStorage,
    });

    return true;
  })();

  return initializationPromise;
}
