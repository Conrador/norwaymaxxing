import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ScreenBackground } from '@/components/screen-background';
import type { PlanId } from '@/config/app';
import { BuildingStep } from '@/features/onboarding/building-step';
import { PaywallStep } from '@/features/onboarding/paywall-step';
import { QUIZ, answersToProfile, type QuizKey } from '@/features/onboarding/questions';
import { QuizStep } from '@/features/onboarding/quiz-step';
import { RoDemoStep } from '@/features/onboarding/ro-demo-step';
import { WelcomeStep } from '@/features/onboarding/welcome-step';
import { usePremium } from '@/hooks/use-premium';
import {
  createOnboardingAnalyticsSession,
  type OnboardingAnalyticsStep,
} from '@/lib/onborn-analytics';
import { useProfile } from '@/stores/profile';

type Phase = 'welcome' | 'quiz' | 'ro' | 'building' | 'paywall';

const emptyAnswers: Record<QuizKey, string[]> = {
  goals: [],
  cold: [],
  sauna: [],
  nature: [],
  diet: [],
};

const WELCOME_STEP: OnboardingAnalyticsStep = { id: 'welcome', type: 'welcome', index: 0 };
const QUIZ_STEPS: Record<QuizKey, OnboardingAnalyticsStep> = {
  goals: { id: 'goal_focus', type: 'quiz', index: 1 },
  cold: { id: 'cold_experience', type: 'quiz', index: 2 },
  sauna: { id: 'sauna_access', type: 'quiz', index: 3 },
  nature: { id: 'nature_access', type: 'quiz', index: 4 },
  diet: { id: 'diet_pattern', type: 'quiz', index: 5 },
};
const RO_STEP: OnboardingAnalyticsStep = {
  id: 'viking_row_preview',
  type: 'native_custom',
  index: 6,
};
const BUILDING_STEP: OnboardingAnalyticsStep = { id: 'plan_reveal', type: 'loading', index: 7 };

export function OnboardingFlow() {
  const setProfile = useProfile((s) => s.setProfile);
  const recordAnswer = useProfile((s) => s.recordAnswer);
  const completeOnboarding = useProfile((s) => s.completeOnboarding);
  const { activatePremium } = usePremium();
  const [analytics] = useState(() => createOnboardingAnalyticsSession());

  const [phase, setPhase] = useState<Phase>('welcome');
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<QuizKey, string[]>>(emptyAnswers);

  const question = QUIZ[quizIndex];
  const activeAnalyticsStep =
    phase === 'welcome'
      ? WELCOME_STEP
      : phase === 'quiz'
        ? QUIZ_STEPS[question.key]
        : phase === 'ro'
          ? RO_STEP
          : phase === 'building'
            ? BUILDING_STEP
            : null;

  useEffect(() => {
    analytics.start();
    if (activeAnalyticsStep) analytics.viewStep(activeAnalyticsStep);
  }, [activeAnalyticsStep, analytics]);

  const toggle = (value: string) => {
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

  const advanceQuiz = () => {
    analytics.completeStep(QUIZ_STEPS[question.key], answers[question.key]);
    recordAnswer(question.key, answers[question.key]);
    if (quizIndex + 1 < QUIZ.length) {
      setQuizIndex((i) => i + 1);
    } else {
      setProfile(answersToProfile(answers));
      setPhase('ro');
    }
  };

  const finishPaywall = (plan?: PlanId) => {
    analytics.completeFlow();
    if (plan) activatePremium(plan);
    completeOnboarding();
  };

  const saunaAccess = (answers.sauna[0] ?? 'occasional') as 'yes' | 'occasional' | 'no';

  return (
    <ScreenBackground>
      <Animated.View
        key={phase === 'quiz' ? `quiz-${quizIndex}` : phase}
        entering={FadeIn.duration(320)}
        exiting={FadeOut.duration(180)}
        style={styles.stepFill}>
        {phase === 'welcome' && (
          <WelcomeStep
            onBegin={() => {
              analytics.completeStep(WELCOME_STEP);
              setPhase('quiz');
            }}
          />
        )}

        {phase === 'quiz' && (
          <QuizStep
            question={question}
            index={quizIndex}
            total={QUIZ.length}
            selected={answers[question.key]}
            onToggle={toggle}
            onContinue={advanceQuiz}
          />
        )}

        {phase === 'ro' && (
          <RoDemoStep
            onFinish={() => {
              analytics.completeStep(RO_STEP, { completed: true });
              setPhase('building');
            }}
            onSkip={() => {
              analytics.skipStep(RO_STEP);
              setPhase('building');
            }}
          />
        )}

        {phase === 'building' && (
          <BuildingStep
            saunaAccess={saunaAccess}
            onDone={() => {
              analytics.completeStep(BUILDING_STEP);
              setPhase('paywall');
            }}
          />
        )}

        {phase === 'paywall' && (
          <PaywallStep
            analyticsContext={analytics.paywallContext}
            onSubscribe={finishPaywall}
            onDismiss={() => finishPaywall()}
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
