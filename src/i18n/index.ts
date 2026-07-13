import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { LANGUAGES, useSettings, type Language } from '@/stores/settings';

import da from './locales/da.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import no from './locales/no.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import sv from './locales/sv.json';

const resources = {
  en: { translation: en },
  no: { translation: no },
  pl: { translation: pl },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  pt: { translation: pt },
  nl: { translation: nl },
  sv: { translation: sv },
  da: { translation: da },
} as const;

function deviceLanguage(): Language {
  for (const locale of getLocales()) {
    const code = locale.languageCode;
    if (!code) continue;
    // Norwegian variants (nb, nn) map to our `no` bundle
    if (code === 'nb' || code === 'nn') return 'no';
    if ((LANGUAGES as string[]).includes(code)) return code as Language;
  }
  return 'en';
}

export function resolvedLanguage(): Language {
  return useSettings.getState().language ?? deviceLanguage();
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: resolvedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Keep i18next in sync with the language picked in settings.
useSettings.subscribe((state, prev) => {
  if (state.language !== prev.language) {
    i18n.changeLanguage(state.language ?? deviceLanguage());
  }
});

export default i18n;
