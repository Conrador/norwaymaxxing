export function localeForLanguage(language?: string) {
  const code = language?.split('-')[0];
  if (code === 'pl') return 'pl-PL';
  if (code === 'no' || code === 'nb' || code === 'nn') return 'nb-NO';
  if (code === 'de') return 'de-DE';
  if (code === 'fr') return 'fr-FR';
  if (code === 'es') return 'es-ES';
  if (code === 'it') return 'it-IT';
  if (code === 'pt') return 'pt-PT';
  if (code === 'nl') return 'nl-NL';
  if (code === 'sv') return 'sv-SE';
  if (code === 'da') return 'da-DK';
  return 'en-US';
}
