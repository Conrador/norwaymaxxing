const DEFAULT_LEGAL_BASE_URL = 'https://norwaymaxxing-legal.vercel.app';

const legalBaseUrl = (
  process.env.EXPO_PUBLIC_LEGAL_BASE_URL?.trim() || DEFAULT_LEGAL_BASE_URL
).replace(/\/$/, '');

export const PRIVACY_POLICY_URL = `${legalBaseUrl}/privacy`;
export const TERMS_URL = `${legalBaseUrl}/terms`;
export const HEALTH_SAFETY_URL = `${TERMS_URL}#health-safety`;
