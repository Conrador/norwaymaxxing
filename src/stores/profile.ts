import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { dateKey } from '@/lib/dates';

/** Local profile answers. Remote onboarding is deferred until monetization returns. */

export type Goal = 'energy' | 'resilience' | 'calm' | 'sleep' | 'physique';
export type ColdLevel = 'never' | 'sometimes' | 'regular';
export type SaunaAccess = 'yes' | 'occasional' | 'no';
export type NatureAccess = 'forest' | 'park' | 'city';
export type DietState = 'processed' | 'mixed' | 'clean';

export type Profile = {
  goals: Goal[];
  coldLevel: ColdLevel;
  saunaAccess: SaunaAccess;
  natureAccess: NatureAccess;
  diet: DietState;
};

type ProfileState = {
  profile: Profile | null;
  /** Raw answers captured from local or future remote onboarding, keyed by step id. */
  rawAnswers: Record<string, unknown>;
  onboardingCompleted: boolean;
  /** Local yyyy-mm-dd used as the first available dashboard calendar day. */
  onboardingCompletedAt: string | null;
  /** RO! onboarding reward. StoreKit still decides whether the offer can be redeemed. */
  roRewardUnlocked: boolean;
  roRewardUnlockedAt: string | null;
  setProfile: (profile: Profile) => void;
  recordAnswer: (stepId: string, answer: unknown) => void;
  unlockRoReward: () => void;
  completeOnboarding: () => void;
  reset: () => void;
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      rawAnswers: {},
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      roRewardUnlocked: false,
      roRewardUnlockedAt: null,
      setProfile: (profile) => set({ profile }),
      recordAnswer: (stepId, answer) =>
        set((s) => ({ rawAnswers: { ...s.rawAnswers, [stepId]: answer } })),
      unlockRoReward: () =>
        set({ roRewardUnlocked: true, roRewardUnlockedAt: new Date().toISOString() }),
      completeOnboarding: () =>
        set({ onboardingCompleted: true, onboardingCompletedAt: dateKey() }),
      reset: () =>
        set({
          profile: null,
          rawAnswers: {},
          onboardingCompleted: false,
          onboardingCompletedAt: null,
          roRewardUnlocked: false,
          roRewardUnlockedAt: null,
        }),
    }),
    {
      name: 'profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
