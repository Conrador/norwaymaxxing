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
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language | null) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      language: null,
      setThemeMode: (themeMode) => set({ themeMode }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
