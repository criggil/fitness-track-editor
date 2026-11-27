import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, translate, useI18nStore } from './index';
import { en, type TranslationKey } from './locales/en';

describe('i18n localization', () => {
  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(useI18nStore.getState().locale).toBe('en');
  });

  it('has complete non-empty translations for every registered locale', () => {
    const enKeys = Object.keys(en) as TranslationKey[];
    for (const [code, localeDef] of Object.entries(LOCALES)) {
      for (const key of enKeys) {
        const val = localeDef.messages[key];
        expect(val, `Missing key "${key}" in locale "${code}"`).toBeTypeOf('string');
        expect(val.trim().length, `Empty value for "${key}" in locale "${code}"`).toBeGreaterThan(0);
      }
    }
  });

  it('interpolates parameters and switches languages', () => {
    expect(translate('app.editsCount', { count: 3 }, 'en')).toBe('3 edit(s)');
    expect(translate('app.editsCount', { count: 3 }, 'ru')).toBe('3 прав.');

    useI18nStore.getState().setLocale('ru');
    expect(translate('tab.scenarios')).toBe('Сценарии');
    useI18nStore.getState().setLocale('en');
    expect(translate('tab.scenarios')).toBe('Scenarios');
  });
});
