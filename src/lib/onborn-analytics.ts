import { Onborn } from '@onborn/analytics';

import {
  ONBORN_ANALYTICS_FLOW_ID,
  ONBORN_ANALYTICS_VARIANT,
  ONBORN_LOCAL_PAYWALL_ID,
  ONBORN_PAYWALL_TEMPLATE,
} from '@/config/onborn';
import { initializeOnborn } from '@/lib/onborn-runtime';

type AnalyticsUserType = 'new' | 'returning';
type OnbornTrackEventInput = Parameters<typeof Onborn.track>[0];

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

let eventChain: Promise<void> = Promise.resolve();

function createAnalyticsId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function ensureInitialized(userType: AnalyticsUserType) {
  return initializeOnborn(userType);
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
    flowId: `paywall:${ONBORN_LOCAL_PAYWALL_ID}`,
    sessionId: createAnalyticsId('paywall'),
    userType: 'returning',
  };
}

function paywallFields(context: PaywallAnalyticsContext) {
  return {
    flowId: context.flowId,
    sessionId: context.sessionId,
    stepId: `paywall:${ONBORN_LOCAL_PAYWALL_ID}:screen`,
    paywallId: ONBORN_LOCAL_PAYWALL_ID,
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

export function trackPaywallConverted(
  context: PaywallAnalyticsContext,
  productId: string,
) {
  track(context.userType, {
    ...paywallFields(context),
    type: 'paywall_converted',
    productId,
    variant: ONBORN_ANALYTICS_VARIANT,
  });
  void flushOnbornAnalytics();
}

export function trackPaywallPurchaseFailed(
  context: PaywallAnalyticsContext,
  packageId: string,
  productId: string,
  reason: 'cancelled' | 'error' | 'pending',
  message?: string,
) {
  track(context.userType, {
    ...paywallFields(context),
    type: 'paywall_purchase_failed',
    packageId,
    productId,
    reason,
    message,
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
