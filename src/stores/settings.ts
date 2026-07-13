import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

export type Language =
  | 'en'
  | 'no'
  | 'pl'
  | 'de'
  | 'fr'
  | 'es'
  | 'it'
  | 'pt'
  | 'nl'
  | 'sv'
  | 'da';

export const LANGUAGES: Language[] = ['en', 'no', 'pl', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'da'];

type SettingsState = {
  themeMode: ThemeMode;
  /** null = follow device locale */
  language: Language | null;
  reminderEnabled: boolean;
  /** minutes from midnight, local time */
  reminderTime: number;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language | null) => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderTime: (minutes: number) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      language: null,
      reminderEnabled: false,
      reminderTime: 7 * 60,
      setThemeMode: (themeMode) => set({ themeMode }),
      setLanguage: (language) => set({ language }),
      setReminderEnabled: (reminderEnabled) => set({ reminderEnabled }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
