import { create } from 'zustand';
import { en, type TranslationDictionary, type TranslationKey } from './locales/en';
import { ru } from './locales/ru';

export interface LocaleDefinition {
  code: string;
  nativeName: string;
  messages: TranslationDictionary;
}

/**
 * Locale registry.
 * To add a new language:
 * 1. Create `src/i18n/locales/<code>.ts` exporting a `TranslationDictionary`.
 * 2. Register it in `LOCALES` below.
 */
export const LOCALES = {
  en: {
    code: 'en',
    nativeName: 'English',
    messages: en,
  },
  ru: {
    code: 'ru',
    nativeName: 'Русский',
    messages: ru,
  },
} as const satisfies Record<string, LocaleDefinition>;

export type LocaleCode = keyof typeof LOCALES;

export const DEFAULT_LOCALE: LocaleCode = 'en';
export const AVAILABLE_LOCALES: LocaleDefinition[] = Object.values(LOCALES);

const STORAGE_KEY = 'fit-editor-locale';

function isSupportedLocale(code: string | null): code is LocaleCode {
  return code != null && code in LOCALES;
}

function loadInitialLocale(): LocaleCode {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isSupportedLocale(saved)) return saved;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_LOCALE;
}

function applyDocumentLang(locale: LocaleCode) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}

export type TranslationParams = Record<string, string | number>;

export function formatMessage(
  dict: TranslationDictionary,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  let text: string = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

interface I18nState {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
}

const initialLocale = loadInitialLocale();
applyDocumentLang(initialLocale);

export const useI18nStore = create<I18nState>((set) => ({
  locale: initialLocale,
  setLocale: (locale) => {
    if (!isSupportedLocale(locale)) return;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, locale);
      }
    } catch {
      // ignore
    }
    applyDocumentLang(locale);
    set({ locale });
  },
}));

/**
 * Non-hook translator for use in stores and utility functions.
 */
export function translate(
  key: TranslationKey,
  params?: TranslationParams,
  localeOverride?: LocaleCode,
): string {
  const locale = localeOverride ?? useI18nStore.getState().locale;
  const dict = LOCALES[locale]?.messages ?? en;
  return formatMessage(dict, key, params);
}

/**
 * React hook returning reactive `t`, current `locale`, `setLocale`, and `locales`.
 */
export function useI18n() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const dict = LOCALES[locale]?.messages ?? en;

  const t = (key: TranslationKey, params?: TranslationParams) =>
    formatMessage(dict, key, params);

  return {
    locale,
    setLocale,
    t,
    locales: AVAILABLE_LOCALES,
  };
}

export type { TranslationDictionary, TranslationKey };
