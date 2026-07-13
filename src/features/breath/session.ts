import type { BreathPhase } from '@/features/cold/plan';

export type GuidedBreathStep = {
  phase: Extract<BreathPhase, 'inhale' | 'exhale'>;
  seconds: number;
};

export type GuidedBreathSession = {
  steps: readonly GuidedBreathStep[];
  totalSeconds: number;
  subtitleKey: string;
};

const BALANCED_STEPS = [
  { phase: 'inhale', seconds: 5 },
  { phase: 'exhale', seconds: 5 },
] as const satisfies readonly GuidedBreathStep[];

const LONG_EXHALE_STEPS = [
  { phase: 'inhale', seconds: 4 },
  { phase: 'exhale', seconds: 6 },
] as const satisfies readonly GuidedBreathStep[];

export function guidedBreathSession(taskId?: string, minutes?: number): GuidedBreathSession {
  if (taskId === 'breath-slow') {
    return {
      steps: BALANCED_STEPS,
      totalSeconds: (minutes ?? 5) * 60,
      subtitleKey: 'breath.slowSubtitle',
    };
  }

  if (taskId === 'heat-alternative') {
    return {
      steps: LONG_EXHALE_STEPS,
      totalSeconds: (minutes ?? 8) * 60,
      subtitleKey: 'breath.recoverySubtitle',
    };
  }

  return {
    steps: LONG_EXHALE_STEPS,
    totalSeconds: (minutes ?? (taskId === 'breath-reset' ? 6 : 4)) * 60,
    subtitleKey: taskId === 'breath-reset' ? 'breath.resetSubtitle' : 'breath.practiceSubtitle',
  };
}

export function breathStepAtElapsed(session: GuidedBreathSession, elapsedSeconds: number) {
  const cycleSeconds = session.steps.reduce((total, step) => total + step.seconds, 0);
  const cycleElapsed = elapsedSeconds % cycleSeconds;
  let stepStart = 0;

  for (const step of session.steps) {
    const stepEnd = stepStart + step.seconds;
    if (cycleElapsed < stepEnd) {
      return {
        cycleSeconds,
        step,
        countdown: stepEnd - cycleElapsed,
      };
    }
    stepStart = stepEnd;
  }

  return { cycleSeconds, step: session.steps[0], countdown: session.steps[0].seconds };
}
