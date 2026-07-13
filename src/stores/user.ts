import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Anonymous, device-local user identity. There is no login; this id gives us a
 * stable local profile key and can later be reused for analytics/entitlements.
 */

function generateAnonymousId(): string {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return `anon-${Array.from({ length: 32 }, hex).join('')}`;
}

type UserState = {
  userId: string;
};

export const useUser = create<UserState>()(
  persist(() => ({ userId: generateAnonymousId() }), {
    name: 'user',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);
