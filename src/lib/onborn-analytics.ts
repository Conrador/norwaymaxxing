import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Onborn,
  type AnalyticsStorage,
  type OnbornTrackEventInput,
} from '@onborn/analytics';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';

import {
  ONBORN_ANALYTICS_FLOW_ID,
  ONBORN_ANALYTICS_PAYWALL_ID,
  ONBORN_ANALYTICS_VARIANT,
  ONBORN_PAYWALL_TEMPLATE,
} from '@/config/onborn';
import { useSettings } from '@/stores/settings';

type AnalyticsUserType = 'new' | 'returning';

export type OnboardingAnalyticsStep = {
  id: string;
  type: string;
  index: number;
};

export type PaywallAnalyticsContext = {
  flowId: string;
  sessionId: string;
  userType: AnalyticsUserType;
};

const ANALYTICS_SDK_VERSION = '0.1.0-beta.1';
const USER_ID_KEY = 'onborn:anonymous-user-id';
const API_KEY = process.env.EXPO_PUBLIC_ONBORN_SDK_API_KEY?.trim();

const storage: AnalyticsStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

let userIdPromise: Promise<string> | null = null;
let eventChain: Promise<void> = Promise.resolve();
let initializedUserType: AnalyticsUserType | null = null;
const fallbackUserId = createAnalyticsId('user');
let warnedAboutMissingKey = false;

function createAnalyticsId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function getUserId() {
  if (!userIdPromise) {
    userIdPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_ID_KEY);
        if (stored) return stored;
        const generated = createAnalyticsId('user');
        await AsyncStorage.setItem(USER_ID_KEY, generated);
        return generated;
      } catch {
        return fallbackUserId;
      }
    })();
  }
  return userIdPromise;
}

async function ensureInitialized(userType: AnalyticsUserType) {
  if (!API_KEY) {
    if (__DEV__ && !warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.warn('Onborn analytics disabled: EXPO_PUBLIC_ONBORN_SDK_API_KEY is missing.');
    }
    return false;
  }

  if (initializedUserType === userType && Onborn.getConfig()) return true;

  if (Onborn.getConfig()) {
    await Onborn.flush().catch((error) => {
      if (__DEV__) console.warn('Unable to flush Onborn analytics before reinitializing.', error);
    });
  }

  const deviceLocale = getLocales()[0];
  const locale = useSettings.getState().language ?? deviceLocale?.languageCode ?? 'en';
  const userId = await getUserId();

  Onborn.init({
    apiKey: API_KEY,
    userId,
    appId: Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.norwaymaxxing.app',
    platform: 'ios',
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
    sdkVersion: ANALYTICS_SDK_VERSION,
    locale,
    country: deviceLocale?.regionCode ?? undefined,
    userType,
    autoFlushMs: 10_000,
    maxAnalyticsBatchSize: 50,
    analyticsQueueKey: `onborn:analytics:${userType}`,
    analyticsStorage: storage,
  });

  initializedUserType = userType;
  return true;
}

function track(userType: AnalyticsUserType, event: OnbornTrackEventInput) {
  eventChain = eventChain
    .then(async () => {
      if (!(await ensureInitialized(userType))) return;
      await Onborn.track(event);
    })
    .catch((error) => {
      if (__DEV__) console.warn('Unable to queue Onborn analytics event.', error);
    });
}

export async function flushOnbornAnalytics() {
  await eventChain;
  if (!Onborn.getConfig()) return;
  await Onborn.flush().catch((error) => {
    if (__DEV__) console.warn('Unable to flush Onborn analytics.', error);
  });
}

export async function stopOnbornAnalytics() {
  if (Onborn.getConfig()) Onborn.stopAutoFlush();
  await flushOnbornAnalytics();
}

export function createOnboardingAnalyticsSession() {
  const sessionId = createAnalyticsId('onboarding');
  const flowStartedAt = Date.now();
  const handledSteps = new Set<string>();
  let stepsCompleted = 0;
  let currentStepId: string | null = null;
  let currentStepStartedAt = flowStartedAt;
  let started = false;
  let finished = false;

  const paywallContext: PaywallAnalyticsContext = {
    flowId: ONBORN_ANALYTICS_FLOW_ID,
    sessionId,
    userType: 'new',
  };

  return {
    paywallContext,
    start() {
      if (started) return;
      started = true;
      track('new', {
        type: 'flow_started',
        flowId: ONBORN_ANALYTICS_FLOW_ID,
        sessionId,
        variant: ONBORN_ANALYTICS_VARIANT,
      });
    },
    viewStep(step: OnboardingAnalyticsStep) {
      if (finished || currentStepId === step.id) return;
      currentStepId = step.id;
      currentStepStartedAt = Date.now();
      track('new', {
        type: 'step_viewed',
        flowId: ONBORN_ANALYTICS_FLOW_ID,
        sessionId,
        stepId: step.id,
        stepType: step.type,
        stepIndex: step.index,
      });
    },
    completeStep(step: OnboardingAnalyticsStep, answer?: unknown) {
      if (finished || handledSteps.has(step.id)) return;
      handledSteps.add(step.id);
      stepsCompleted += 1;
      track('new', {
        type: 'step_completed',
        flowId: ONBORN_ANALYTICS_FLOW_ID,
        sessionId,
        stepId: step.id,
        stepType: step.type,
        stepIndex: step.index,
        timeSpentMs: Math.max(0, Date.now() - currentStepStartedAt),
        answer,
      });
      currentStepId = null;
    },
    skipStep(step: OnboardingAnalyticsStep) {
      if (finished || handledSteps.has(step.id)) return;
      handledSteps.add(step.id);
      track('new', {
        type: 'step_skipped',
        flowId: ONBORN_ANALYTICS_FLOW_ID,
        sessionId,
        stepId: step.id,
        stepIndex: step.index,
      });
      currentStepId = null;
    },
    completeFlow() {
      if (finished) return;
      finished = true;
      track('new', {
        type: 'flow_completed',
        flowId: ONBORN_ANALYTICS_FLOW_ID,
        sessionId,
        totalTimeMs: Math.max(0, Date.now() - flowStartedAt),
        stepsCompleted,
        variant: ONBORN_ANALYTICS_VARIANT,
      });
      void flushOnbornAnalytics();
    },
  };
}

export function createStandalonePaywallAnalyticsContext(): PaywallAnalyticsContext {
  return {
    flowId: `paywall:${ONBORN_ANALYTICS_PAYWALL_ID}`,
    sessionId: createAnalyticsId('paywall'),
    userType: 'returning',
  };
}

function paywallFields(context: PaywallAnalyticsContext) {
  return {
    flowId: context.flowId,
    sessionId: context.sessionId,
    stepId: `paywall:${ONBORN_ANALYTICS_PAYWALL_ID}:screen`,
    paywallId: ONBORN_ANALYTICS_PAYWALL_ID,
    paywallTemplate: ONBORN_PAYWALL_TEMPLATE,
  };
}

export function trackPaywallViewed(context: PaywallAnalyticsContext) {
  track(context.userType, {
    ...paywallFields(context),
    type: 'paywall_viewed',
    variant: ONBORN_ANALYTICS_VARIANT,
  });
}

export function trackPaywallPackageSelected(
  context: PaywallAnalyticsContext,
  packageId: string,
  productId: string,
) {
  track(context.userType, {
    ...paywallFields(context),
    type: 'paywall_package_selected',
    packageId,
    productId,
    variant: ONBORN_ANALYTICS_VARIANT,
  });
}

export function trackPaywallPurchaseStarted(
  context: PaywallAnalyticsContext,
  packageId: string,
  productId: string,
) {
  track(context.userType, {
    ...paywallFields(context),
    type: 'paywall_purchase_started',
    packageId,
    productId,
    variant: ONBORN_ANALYTICS_VARIANT,
  });
}

export function trackPaywallDismissed(context: PaywallAnalyticsContext, timeSpentMs: number) {
  track(context.userType, {
    ...paywallFields(context),
    type: 'paywall_dismissed',
    timeSpentMs: Math.max(0, timeSpentMs),
  });
  void flushOnbornAnalytics();
}
