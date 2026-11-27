import { Globe } from 'lucide-react';
import { useI18n, type LocaleCode } from '../i18n';

export function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useI18n();

  return (
    <label
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 transition-colors"
      title={t('common.language')}
    >
      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <select
        aria-label={t('common.language')}
        value={locale}
        onChange={(e) => setLocale(e.target.value as LocaleCode)}
        className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
      >
        {locales.map((loc) => (
          <option
            key={loc.code}
            value={loc.code}
            className="bg-slate-900 text-slate-200"
          >
            {loc.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
