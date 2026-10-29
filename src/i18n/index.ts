import i18n, { type PostProcessorModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, isLangCode, type LangCode } from '../lang';

const localeModules = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', { eager: true, import: 'default' });

export const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, data] of Object.entries(localeModules)) {
  const [, lang, file] = path.match(/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (resources[lang] ??= {})[file] = data;
}

// Dev-only: ?pseudo wraps every translated string so hard-coded UI text stands out.
const pseudo: PostProcessorModule = {
  type: 'postProcessor',
  name: 'pseudo',
  process: (value: string) => `⟦${value}⟧`,
};
const usePseudo = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('pseudo');

const STORAGE_KEY = 'okuma.uiLang';

function initialLanguage(): LangCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isLangCode(stored)) return stored;
  const browser = navigator.language.slice(0, 2);
  return isLangCode(browser) ? browser : DEFAULT_LANGUAGE;
}

/** Switches the UI language and remembers it for the next start (profile list is shown before a profile is chosen). */
export function setUiLanguage(lang: LangCode) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}

i18n.on('languageChanged', (lang) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = i18n.t('app.title');
});

i18n
  .use(pseudo)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    postProcess: usePseudo ? ['pseudo'] : false,
  });

export default i18n;
