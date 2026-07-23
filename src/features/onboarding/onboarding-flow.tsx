import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ScreenBackground } from '@/components/screen-background';
import { BuildingStep } from '@/features/onboarding/building-step';
import { InsightStep, type InsightKind } from '@/features/onboarding/insight-step';
import { PaywallStep } from '@/features/onboarding/paywall-step';
import { PlanFitStep, ProtocolReadyStep } from '@/features/onboarding/plan-reveal-step';
import { QUIZ, answersToProfile, type QuizKey } from '@/features/onboarding/questions';
import { QuizStep } from '@/features/onboarding/quiz-step';
import { RoDemoStep, type RoDemoResult } from '@/features/onboarding/ro-demo-step';
import { RoRewardIntroStep, RoRewardResultStep } from '@/features/onboarding/ro-reward-step';
import { WelcomeStep } from '@/features/onboarding/welcome-step';
import {
  useNativeStoreBilling,
  useRoRewardOffer,
} from '@/features/premium/use-native-store-billing';
import {
  createOnboardingAnalyticsSession,
  type OnboardingAnalyticsStep,
} from '@/lib/onborn-analytics';
import { useProfile } from '@/stores/profile';

type Phase = 'welcome' | 'journey' | 'ro' | 'roResult' | 'building' | 'result' | 'ready' | 'paywall';

type JourneyStep =
  | { id: string; kind: 'quiz'; questionKey: QuizKey }
  | { id: string; kind: 'insight'; insight: InsightKind };

const JOURNEY: readonly JourneyStep[] = [
  { id: 'goal_focus', kind: 'quiz', questionKey: 'goals' },
  { id: 'protocol_benefits', kind: 'insight', insight: 'benefits' },
  { id: 'cold_experience', kind: 'quiz', questionKey: 'cold' },
  { id: 'sauna_access', kind: 'quiz', questionKey: 'sauna' },
  { id: 'sauna_method', kind: 'insight', insight: 'sauna' },
  { id: 'evidence_standard', kind: 'insight', insight: 'evidence' },
  { id: 'nature_access', kind: 'quiz', questionKey: 'nature' },
  { id: 'friluftsliv_method', kind: 'insight', insight: 'nature' },
  { id: 'diet_pattern', kind: 'quiz', questionKey: 'diet' },
  { id: 'nordic_diet_method', kind: 'insight', insight: 'diet' },
  { id: 'first_wave', kind: 'insight', insight: 'community' },
  { id: 'viking_row_intro', kind: 'insight', insight: 'ro' },
] as const;

const QUIZ_BY_KEY = Object.fromEntries(QUIZ.map((question) => [question.key, question])) as Record<
  QuizKey,
  (typeof QUIZ)[number]
>;

const emptyAnswers: Record<QuizKey, string[]> = {
  goals: [],
  cold: [],
  sauna: [],
  nature: [],
  diet: [],
};

const WELCOME_STEP: OnboardingAnalyticsStep = { id: 'welcome', type: 'welcome', index: 0 };
const JOURNEY_ANALYTICS_STEPS = JOURNEY.map<OnboardingAnalyticsStep>((step, index) => ({
  id: step.id,
  type: step.kind === 'quiz' ? 'quiz' : 'content',
  index: index + 1,
}));
const BUILDING_STEP: OnboardingAnalyticsStep = {
  id: 'plan_building',
  type: 'loading',
  index: JOURNEY.length + 2,
};
const RESULT_STEP: OnboardingAnalyticsStep = {
  id: 'personalized_plan_value',
  type: 'content',
  index: JOURNEY.length + 3,
};
const READY_STEP: OnboardingAnalyticsStep = {
  id: 'protocol_ready',
  type: 'content',
  index: JOURNEY.length + 4,
};

export function OnboardingFlow() {
  const setProfile = useProfile((s) => s.setProfile);
  const recordAnswer = useProfile((s) => s.recordAnswer);
  const completeOnboarding = useProfile((s) => s.completeOnboarding);
  const reachOnboardingPaywall = useProfile((s) => s.reachOnboardingPaywall);
  const unlockRoReward = useProfile((s) => s.unlockRoReward);
  const storedRoRewardUnlocked = useProfile((s) => s.roRewardUnlocked);
  const storeBilling = useNativeStoreBilling();
  const rewardOffer = useRoRewardOffer(storeBilling.billingAdapter);
  const [analytics] = useState(() => createOnboardingAnalyticsSession());

  const [phase, setPhase] = useState<Phase>('welcome');
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<QuizKey, string[]>>(emptyAnswers);
  const [roAttempt, setRoAttempt] = useState(1);
  const [roResult, setRoResult] = useState<RoDemoResult | null>(null);
  const [rewardMode, setRewardMode] = useState(false);

  const journeyStep = JOURNEY[journeyIndex];
  const question = journeyStep.kind === 'quiz' ? QUIZ_BY_KEY[journeyStep.questionKey] : null;
  const rewardAvailable =
    rewardOffer.available &&
    Boolean(rewardOffer.introductoryPrice && rewardOffer.standardPrice);
  const activeRoStep: OnboardingAnalyticsStep = {
    id: rewardMode ? `viking_row_reward_attempt_${roAttempt}` : 'viking_row_preview',
    type: 'native_custom',
    index: JOURNEY.length + roAttempt,
  };
  const activeRoResultStep: OnboardingAnalyticsStep = {
    id: `ro_reward_result_${roAttempt}`,
    type: 'content',
    index: JOURNEY.length + roAttempt + 1,
  };
  const activeAnalyticsStep =
    phase === 'welcome'
      ? WELCOME_STEP
      : phase === 'journey'
        ? JOURNEY_ANALYTICS_STEPS[journeyIndex]
        : phase === 'ro'
          ? activeRoStep
          : phase === 'roResult'
            ? activeRoResultStep
            : phase === 'building'
              ? BUILDING_STEP
              : phase === 'result'
                ? RESULT_STEP
                : phase === 'ready'
                  ? READY_STEP
                  : null;

  useEffect(() => {
    analytics.start();
    if (activeAnalyticsStep) analytics.viewStep(activeAnalyticsStep);
  }, [activeAnalyticsStep, analytics]);

  const toggle = (value: string) => {
    if (!question) return;
    setAnswers((prev) => {
      const current = prev[question.key];
      if (question.multi) {
        const has = current.includes(value);
        if (has) return { ...prev, [question.key]: current.filter((v) => v !== value) };
        if (current.length >= (question.maxSelect ?? 3)) return prev;
        return { ...prev, [question.key]: [...current, value] };
      }
      return { ...prev, [question.key]: [value] };
    });
  };

  const advanceJourney = () => {
    const analyticsStep = JOURNEY_ANALYTICS_STEPS[journeyIndex];
    if (journeyStep.kind === 'quiz') {
      analytics.completeStep(analyticsStep, answers[journeyStep.questionKey]);
      recordAnswer(journeyStep.questionKey, answers[journeyStep.questionKey]);
    } else {
      analytics.completeStep(analyticsStep);
    }

    if (journeyIndex + 1 < JOURNEY.length) {
      setJourneyIndex((index) => index + 1);
    } else {
      setProfile(answersToProfile(answers));
      setRewardMode(rewardAvailable);
      setPhase('ro');
    }
  };

  const goBack = () => {
    if (journeyIndex === 0) {
      setPhase('welcome');
      return;
    }
    setJourneyIndex((index) => index - 1);
  };

  const finishPaywall = () => {
    analytics.completeFlow();
    completeOnboarding();
  };

  const saunaAccess = (answers.sauna[0] ?? 'occasional') as 'yes' | 'occasional' | 'no';
  const profile = answersToProfile(answers);

  return (
    <ScreenBackground>
      <Animated.View
        key={phase === 'journey' ? `journey-${journeyStep.id}` : phase}
        entering={FadeIn.duration(320)}
        exiting={FadeOut.duration(180)}
        style={styles.stepFill}>
        {phase === 'welcome' && (
          <WelcomeStep
            onBegin={() => {
              analytics.completeStep(WELCOME_STEP);
              setPhase('journey');
            }}
          />
        )}

        {phase === 'journey' && question && (
          <QuizStep
            question={question}
            progressCurrent={journeyIndex + 1}
            progressTotal={JOURNEY.length}
            selected={answers[question.key]}
            onToggle={toggle}
            onContinue={advanceJourney}
            onBack={goBack}
          />
        )}

        {phase === 'journey' && journeyStep.kind === 'insight' &&
          (journeyStep.insight === 'ro' && rewardAvailable && rewardOffer.introductoryPrice && rewardOffer.standardPrice ? (
            <RoRewardIntroStep
              introductoryPrice={rewardOffer.introductoryPrice}
              standardPrice={rewardOffer.standardPrice}
              onContinue={advanceJourney}
              onBack={goBack}
            />
          ) : (
            <InsightStep
              kind={journeyStep.insight}
              onContinue={advanceJourney}
              onBack={goBack}
            />
          ))}

        {phase === 'ro' && (
          <RoDemoStep
            key={`ro-attempt-${roAttempt}`}
            attempt={roAttempt}
            rewardEnabled={rewardMode}
            onFinish={(result) => {
              analytics.completeStep(activeRoStep, result);
              if (!rewardMode) {
                setPhase('building');
                return;
              }
              setRoResult(result);
              if (result.unlocked) unlockRoReward();
              setPhase('roResult');
            }}
            onSkip={() => {
              analytics.skipStep(activeRoStep);
              setPhase('building');
            }}
          />
        )}

        {phase === 'roResult' && roResult && (
          <RoRewardResultStep
            result={roResult}
            canRetry={!roResult.unlocked && roAttempt < 2}
            onRetry={() => {
              analytics.completeStep(activeRoResultStep, { action: 'retry', ...roResult });
              setRoAttempt((attempt) => attempt + 1);
              setRoResult(null);
              setPhase('ro');
            }}
            onContinue={() => {
              analytics.completeStep(activeRoResultStep, {
                action: roResult.unlocked ? 'claimed' : 'continued',
                ...roResult,
              });
              setPhase('building');
            }}
          />
        )}

        {phase === 'building' && (
          <BuildingStep
            saunaAccess={saunaAccess}
            onDone={() => {
              analytics.completeStep(BUILDING_STEP);
              setPhase('result');
            }}
          />
        )}

        {phase === 'result' && (
          <PlanFitStep
            profile={profile}
            onContinue={() => {
              analytics.completeStep(RESULT_STEP);
              setPhase('ready');
            }}
          />
        )}

        {phase === 'ready' && (
          <ProtocolReadyStep
            roRewardUnlocked={storedRoRewardUnlocked || Boolean(roResult?.unlocked)}
            onContinue={() => {
              analytics.completeStep(READY_STEP);
              reachOnboardingPaywall();
              setPhase('paywall');
            }}
          />
        )}

        {phase === 'paywall' && (
          <PaywallStep
            analyticsContext={analytics.paywallContext}
            storeBilling={storeBilling}
            roRewardUnlocked={storedRoRewardUnlocked || Boolean(roResult?.unlocked)}
            onSubscribe={finishPaywall}
          />
        )}
      </Animated.View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  stepFill: {
    flex: 1,
  },
});
