import ko from './ko.json';
import en from './en.json';

export const languages = {
  ko: '한국어',
  en: 'English',
} as const;

export const defaultLang = 'ko' as const;

export type Lang = keyof typeof languages;

const translations: Record<Lang, Record<string, string>> = { ko, en };

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    return translations[lang][key] || translations[defaultLang][key] || key;
  };
}

export function getLocalizedPath(path: string, lang: Lang): string {
  // Remove any existing language prefix
  const cleanPath = path.replace(/^\/(ko|en)/, '');
  return `/${lang}${cleanPath || '/'}`;
}
