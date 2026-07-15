import AsyncStorage from '@react-native-async-storage/async-storage';
import { Onborn } from '@onborn/billing';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';

import { useSettings } from '@/stores/settings';

export type OnbornUserType = 'new' | 'returning';

const ONBORN_SDK_VERSION = '0.1.0-beta.2';
const USER_ID_KEY = 'onborn:anonymous-user-id';
const API_KEY = process.env.EXPO_PUBLIC_ONBORN_SDK_API_KEY?.trim();

let userIdPromise: Promise<string> | null = null;
let initializationPromise: Promise<boolean> | null = null;
let warnedAboutMissingKey = false;
const fallbackUserId = createId('user');

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function getOnbornUserId() {
  if (!userIdPromise) {
    userIdPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_ID_KEY);
        if (stored) return stored;

        const generated = createId('user');
        await AsyncStorage.setItem(USER_ID_KEY, generated);
        return generated;
      } catch {
        return fallbackUserId;
      }
    })();
  }

  return userIdPromise;
}

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

    Onborn.init({
      apiKey: API_KEY,
      userId: await getOnbornUserId(),
      appId: Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.norwaymaxxing.norwaymaxxing',
      platform: 'ios',
      appVersion: Constants.expoConfig?.version ?? '1.0.0',
      sdkVersion: ONBORN_SDK_VERSION,
      locale,
      country: deviceLocale?.regionCode ?? undefined,
      userType,
      autoFlushMs: 10_000,
      maxAnalyticsBatchSize: 50,
      analyticsQueueKey: `onborn:analytics:${userType}`,
    });

    return true;
  })();

  return initializationPromise;
}
