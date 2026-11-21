import i18next, { type i18n as I18nInstance } from 'i18next';
import idTranslations from './id.json';
import enTranslations from './en.json';

export const SUPPORTED_LANGUAGES = ['id', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'id';

export function normalizeLanguage(lang?: string | null): SupportedLanguage {
  if (!lang) return DEFAULT_LANGUAGE;
  const cleaned = lang.trim().toLowerCase();
  if (cleaned === 'en' || cleaned.startsWith('en-')) return 'en';
  if (cleaned === 'id' || cleaned.startsWith('id-')) return 'id';
  return DEFAULT_LANGUAGE;
}

const i18nInstance: I18nInstance = i18next.createInstance();

void i18nInstance.init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    id: { translation: idTranslations },
    en: { translation: enTranslations },
  },
});

export function setAppLanguage(lang: string): SupportedLanguage {
  const normalized = normalizeLanguage(lang);
  void i18nInstance.changeLanguage(normalized);
  return normalized;
}

export function getAppLanguage(): SupportedLanguage {
  return normalizeLanguage(i18nInstance.language);
}

export function t(key: string, options?: Record<string, string | number>): string {
  if (options) {
    return i18nInstance.t(key, options);
  }
  return i18nInstance.t(key);
}

export { i18nInstance, idTranslations, enTranslations };
